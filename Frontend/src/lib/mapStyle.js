import * as maptilersdk from '@maptiler/sdk';

export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

// Keyless fallback: Esri World Imagery + place labels, slightly darkened so the fire layers pop.
const KEYLESS_STYLE = {
  version: 8,
  sources: {
    imagery: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 17,
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    },
    labels: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 17,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0b0f14' } },
    {
      id: 'imagery',
      type: 'raster',
      source: 'imagery',
      paint: { 'raster-saturation': -0.35, 'raster-brightness-max': 0.72, 'raster-contrast': 0.08 },
    },
    { id: 'labels', type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.75 } },
  ],
};

export function baseStyle() {
  if (MAPTILER_KEY) {
    maptilersdk.config.apiKey = MAPTILER_KEY;
    return maptilersdk.MapStyle.SATELLITE;
  }
  return KEYLESS_STYLE;
}
