/* File: js/api/nasaService.js
 * Owner: Person A (Ashmin)
 * AI-assisted: YES — Gemini, 2026-11-14. Reviewed by a human: NO.
 * Sources used: none
 */
import { API_CONFIG } from '../config.js';
import { DATA } from './mockData.js';

/**
 * Optional public NASA endpoint fetch with strict timeout and offline fallback.
 * Never blocks gameplay or throws unhandled rejections.
 */
export async function fetchMissionReferenceData() {
  if (!API_CONFIG.enableLiveFetch) {
    return { sourceMode: 'Offline sample', data: DATA, livePayload: null };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const response = await fetch(API_CONFIG.endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return { sourceMode: 'Live NASA data', data: DATA, livePayload: payload };
  } catch {
    clearTimeout(timeoutId);
    return { sourceMode: 'Offline sample', data: DATA, livePayload: null };
  }
}