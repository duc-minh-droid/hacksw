'''
Dependency-light inference for the "Will my house burn?" Keras model.

The model in sequential-model-2.h5 is a plain Sequential stack
(Dense -> BatchNorm -> Dropout ... -> softmax). Loading it through TensorFlow
pulls in a ~500 MB dependency just to do a few matrix multiplies, so this
module reads the weights with h5py and runs the forward pass in NumPy.

The notebook (californa-juypter/model2.ipynb) trained the network on
StandardScaler-normalised features but never saved the scaler, so the
original API fed raw label indices into a model that expected z-scores.
SCALER_MEAN / SCALER_SCALE below were recovered by re-running the notebook's
exact split (train_test_split(test_size=0.2, random_state=42)) on
cleaned_dataset.csv; see export_model.py.
'''
import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(HERE, 'sequential-model-2.h5')
SCALER_PATH = os.path.join(HERE, 'scaler.json')

BN_EPSILON = 1e-3  # Keras BatchNormalization default


def _load_layers(path=MODEL_PATH):
    import h5py  # local import so the module can be imported without h5py for tooling

    layers = []
    with h5py.File(path, 'r') as f:
        config = json.loads(f.attrs['model_config'])
        weights = f['model_weights']
        for layer in config['config']['layers']:
            kind, cfg = layer['class_name'], layer['config']
            name = cfg['name']
            if kind == 'Dense':
                g = weights[name][name]
                layers.append(('dense', np.array(g['kernel:0']), np.array(g['bias:0']), cfg['activation']))
            elif kind == 'BatchNormalization':
                g = weights[name][name]
                layers.append(('bn', np.array(g['gamma:0']), np.array(g['beta:0']),
                               np.array(g['moving_mean:0']), np.array(g['moving_variance:0'])))
            # InputLayer and Dropout are no-ops at inference time
    return layers


def _load_scaler(path=SCALER_PATH):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return np.array(data['mean']), np.array(data['scale'])


class BurnModel:
    '''Numpy re-implementation of the trained Keras model.'''

    def __init__(self, model_path=MODEL_PATH, scaler_path=SCALER_PATH):
        self.layers = _load_layers(model_path)
        self.mean, self.scale = _load_scaler(scaler_path)

    def predict(self, x, scaled=False):
        x = np.asarray(x, dtype=np.float64)
        if not scaled:
            x = (x - self.mean) / self.scale
        for layer in self.layers:
            if layer[0] == 'dense':
                _, kernel, bias, activation = layer
                x = x @ kernel + bias
                if activation == 'relu':
                    x = np.maximum(x, 0)
                elif activation == 'softmax':
                    x = np.exp(x - x.max(axis=-1, keepdims=True))
                    x = x / x.sum(axis=-1, keepdims=True)
            else:
                _, gamma, beta, mean, var = layer
                x = gamma * (x - mean) / np.sqrt(var + BN_EPSILON) + beta
        return x
