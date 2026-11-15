/* File: js/api/nasaService.js
 * Owner: Person A (Ashmin)
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: YES Reviewd by Person C (Yochan)
 * Sources used: SPACEAPPS_CHALLENGE
 */
import { API_CONFIG } from '../config.js';
import { DATA } from './mockData.js';

const CACHE_KEY = 'apogeeNasaDonkiCache_v2';
const CACHE_TTL_MS = 30 * 60 * 1000;

function formatIsoDate(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

function readCachedWeather() {
  try {
    const raw = localStorage[CACHE_KEY];
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Date.now() - parsed.ts < CACHE_TTL_MS && parsed.spaceWeather) {
      return parsed.spaceWeather;
    }
  } catch {}
  return null;
}

function writeCachedWeather(spaceWeather) {
  try {
    localStorage[CACHE_KEY] = JSON.stringify({ ts: Date.now(), spaceWeather });
  } catch {}
}

/**
 * Fetches live space weather (Solar Flares & Coronal Mass Ejections) from NASA's
 * public DONKI API over a 30-day window with caching, timeout, and offline fallback.
 */
export async function fetchMissionReferenceData() {
  const defaultSpaceWeather = {
    isLive: false,
    flareClass: 'M1.4 (Baseline)',
    flareCount: 3,
    cmeCount: 2,
    stormLevel: 'Moderate',
    radiationMultiplier: 1.0,
    summary: 'Solar wind & flare baseline (offline fallback — check internet connection for live NASA DONKI telemetry).',
    src: 'SIMPLIFIED_FOR_GAMEPLAY'
  };

  if (!API_CONFIG.enableLiveFetch) {
    return { sourceMode: 'Offline sample', data: DATA, spaceWeather: defaultSpaceWeather };
  }

  const cached = readCachedWeather();
  if (cached) {
    return { sourceMode: 'Live NASA data', data: DATA, spaceWeather: cached };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const rangeQuery = `&startDate=${formatIsoDate(start)}&endDate=${formatIsoDate(end)}`;

    const [flrRes, cmeRes] = await Promise.all([
      fetch(`${API_CONFIG.donkiFlareEndpoint}${rangeQuery}`, { signal: controller.signal }),
      fetch(`${API_CONFIG.donkiCmeEndpoint}${rangeQuery}`, { signal: controller.signal })
    ]);
    clearTimeout(timeoutId);

    if (!flrRes.ok) throw new Error(`HTTP ${flrRes.status}`);
    const flares = await flrRes.json();
    const cmes = cmeRes.ok ? await cmeRes.json() : [];

    const flareList = Array.isArray(flares) ? flares : [];
    const cmeList = Array.isArray(cmes) ? cmes : [];

    let peakClass = 'C1.0';
    let peakRank = 2;
    flareList.forEach(f => {
      const cls = String(f.classType || '').toUpperCase();
      const rank = cls.startsWith('X') ? 4 : cls.startsWith('M') ? 3 : cls.startsWith('C') ? 2 : 1;
      if (rank >= peakRank && cls) {
        peakRank = rank;
        peakClass = cls;
      }
    });

    const stormLevel = peakRank >= 4 ? `Severe (${peakClass})` : peakRank === 3 ? `Elevated (${peakClass})` : `Nominal (${peakClass})`;
    const radiationMultiplier = peakRank >= 4 ? 1.15 : peakRank === 3 ? 1.05 : 0.96;

    const spaceWeather = {
      isLive: true,
      flareClass: peakClass,
      flareCount: flareList.length,
      cmeCount: cmeList.length,
      stormLevel,
      radiationMultiplier,
      summary: `Live NASA DONKI (30-day telemetry): ${flareList.length} solar flares (peak ${peakClass}) & ${cmeList.length} CMEs tracked.`,
      src: 'NASA DONKI Space Weather API'
    };

    writeCachedWeather(spaceWeather);
    return { sourceMode: 'Live NASA data', data: DATA, spaceWeather };
  } catch {
    clearTimeout(timeoutId);
    return { sourceMode: 'Offline sample', data: DATA, spaceWeather: defaultSpaceWeather };
  }
}