// Browser port of backend/burn_simulator_service.py + weather_service.get_scale_factor.
// Used when no backend is configured (VITE_API_URL unset), e.g. the static Vercel deploy.

// Spread stage colours, inner (hot) to outer
export const RING_COLORS = ['#ffe08a', '#ffb347', '#ff7a3d', '#e8452c', '#9e1f2b'];

function spreadTemplate(tailFactor, tailFrom, tailTo, numPoints = 40) {
  const coords = [];
  const a0 = (tailFrom * Math.PI) / 180;
  const a1 = (tailTo * Math.PI) / 180;
  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    let r = angle >= a0 && angle <= a1 ? tailFactor : 1;
    r *= 1 + (Math.random() * 0.1 - 0.05);
    coords.push([r * Math.cos(angle), r * Math.sin(angle)]);
  }
  coords.push(coords[0]);
  return coords;
}

// [template, tail angle (deg, counter-clockwise from east)] - same shapes as the Python templates 1-14
const TEMPLATES = [
  () => [spreadTemplate(1.5, 60, 120), 90],
  () => [spreadTemplate(1.3, 30, 90), 60],
  () => [spreadTemplate(1.4, 80, 140), 110],
  () => [spreadTemplate(1.6, 50, 110), 80],
  () => [spreadTemplate(1.2, 70, 130), 100],
  () => [spreadTemplate(1.7, 40, 100), 70],
  () => [spreadTemplate(1.5, 90, 150), 120],
  () => [spreadTemplate(1.3, 20, 80), 50],
  () => [spreadTemplate(1.4, 100, 160), 130],
  () => [[[-2, -0.071], [-1, 0.429], [1, 0.929], [2, -0.071], [1, -1.071], [-1, -0.571], [-2, -0.071]], 0],
  () => [[[-2.22, 0], [-1.22, 0.5], [0.78, 1], [1.78, 0], [0.78, -1], [-1.22, -0.5], [-2.22, 0]], 0],
  () => [[[-2, 0], [-1, 1], [1, 1], [2, 0], [1, -1], [-1, -1], [-2, 0]], 0],
];

export function scaleFactorFor(weather) {
  let s = 0.005;
  const t = weather?.temperature ?? 0;
  const h = weather?.humidity ?? 0;
  const w = weather?.wind_speed ?? 0;
  if (t >= 30) s += 0.02;
  else if (t >= 20) s += 0.01;
  if (h < 20) s += 0.02;
  else if (h < 30) s += 0.01;
  if (w > 20) s += 0.02;
  else if (w >= 10) s += 0.01;
  return s;
}

function centroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}

/**
 * Five nested polygons (smallest first) for a fire starting at [lat, lng].
 * windFrom is the meteorological wind direction; the tail is pushed downwind.
 */
export function simulateRings(lat, lng, scaleFactor, windFrom, numNested = 5) {
  const size = scaleFactor + 0.005 + Math.random() * 0.025;
  // The first 9 templates are the organic "blob with a tail" shapes; favour them over the
  // hand-drawn geometric ones (the backend picks uniformly).
  const pick = Math.random() < 0.8 ? Math.floor(Math.random() * 9) : 9 + Math.floor(Math.random() * 3);
  const [template, tailAngle] = TEMPLATES[pick]();
  const downwind = (windFrom + 180) % 360;
  const rot = ((90 - downwind - tailAngle) * Math.PI) / 180;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const outer = template.map(([x, y]) => {
    const sx = x * size, sy = y * size;
    return [sx * cos - sy * sin + lng, sx * sin + sy * cos + lat];
  });
  const [cx, cy] = centroid(outer);
  const rings = [];
  for (let i = 1; i <= numNested; i++) {
    const f = i / numNested;
    rings.push({
      type: 'Feature',
      properties: { nested_index: i, scale_fraction: f },
      geometry: {
        type: 'Polygon',
        coordinates: [outer.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f])],
      },
    });
  }
  return rings;
}

// Rough area of a lng/lat ring in km^2 (equirectangular, fine at this scale)
export function ringAreaKm2(ring) {
  const lat0 = (ring.reduce((s, p) => s + p[1], 0) / ring.length) * (Math.PI / 180);
  const kx = 111.32 * Math.cos(lat0), ky = 110.57;
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * kx * ring[i + 1][1] * ky - ring[i + 1][0] * kx * ring[i][1] * ky;
  }
  return Math.abs(a / 2);
}
