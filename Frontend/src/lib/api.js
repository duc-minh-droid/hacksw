// Talks to the FastAPI backend when VITE_API_URL is set, otherwise runs everything in the browser.
import { simulateRings, scaleFactorFor } from './simulator';
import { predictLocally } from './burnModel';

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Offline fallback: roughly a Santa Ana day (hot, dry, wind from the north-east)
export const DEMO_WEATHER = { temperature: 31, humidity: 17, wind_speed: 11, wind_direction: 45, source: 'demo' };

async function getWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(res.statusText);
    const c = (await res.json()).current;
    return {
      temperature: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      wind_speed: c.wind_speed_10m,
      wind_direction: c.wind_direction_10m ?? 0,
      source: 'open-meteo',
    };
  } catch {
    return { ...DEMO_WEATHER };
  }
}

export async function simulateFire(lat, lng, { demoWeather = false } = {}) {
  if (API_URL && !demoWeather) {
    try {
      const res = await fetch(`${API_URL}/api/simulate?latitude=${lat}&longitude=${lng}`);
      if (res.ok) return { ...(await res.json()), engine: 'api' };
    } catch {
      /* fall through to the in-browser version */
    }
  }
  const weather = demoWeather ? { ...DEMO_WEATHER } : await getWeather(lat, lng);
  const scale_factor = scaleFactorFor(weather);
  return { weather, scale_factor, rings: simulateRings(lat, lng, scale_factor, weather.wind_direction), engine: 'browser' };
}

export async function predictBurn(form) {
  const body = { ...form, age: Number(form.age) || 0 };
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/calculateBurn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && !data.error) return { ...data, engine: 'api' };
    } catch {
      /* fall through */
    }
  }
  return { ...(await predictLocally(body)), engine: 'browser' };
}
