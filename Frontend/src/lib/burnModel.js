// Runs the trained Keras model (exported by backend/export_model.py) in the browser.
let modelPromise;

function loadModel() {
  if (!modelPromise) {
    modelPromise = fetch('/model/burn-model.json').then((r) => {
      if (!r.ok) throw new Error('model not found');
      return r.json();
    }).catch((e) => {
      modelPromise = null; // allow a retry
      throw e;
    });
  }
  return modelPromise;
}

export function preloadModel() {
  loadModel().catch(() => {});
}

function forward(model, input) {
  let x = input.map((v, i) => (v - model.scaler.mean[i]) / model.scaler.scale[i]);
  for (const layer of model.layers) {
    if (layer.type === 'dense') {
      const out = layer.bias.slice();
      for (let i = 0; i < x.length; i++) {
        const row = layer.kernel[i];
        const xi = x[i];
        for (let j = 0; j < out.length; j++) out[j] += xi * row[j];
      }
      if (layer.activation === 'relu') x = out.map((v) => Math.max(0, v));
      else if (layer.activation === 'softmax') {
        const m = Math.max(...out);
        const e = out.map((v) => Math.exp(v - m));
        const s = e.reduce((a, b) => a + b, 0);
        x = e.map((v) => v / s);
      } else x = out;
    } else {
      x = x.map((v, i) => layer.gamma[i] * (v - layer.mean[i]) / Math.sqrt(layer.variance[i] + layer.epsilon) + layer.beta[i]);
    }
  }
  return x;
}

export async function predictLocally(form) {
  const model = await loadModel();
  const input = model.features.map((name) => {
    if (name === 'age') return Number(form.age) || 0;
    const entry = Object.entries(model.mappings[name]).find(([, label]) => label === form[name]);
    if (!entry) throw new Error(`Unknown value for ${name}`);
    return Number(entry[0]);
  });
  const probs = forward(model, input);
  const labels = Object.keys(model.mappings.damage).sort((a, b) => a - b).map((k) => model.mappings.damage[k]);
  const best = probs.indexOf(Math.max(...probs));
  return { predicted_damage: labels[best], probabilities: [probs], labels };
}
