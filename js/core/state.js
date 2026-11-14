/* File: js/core/state.js
 * Owner: Person A (Ashmin)
 * AI-assisted: YES — Gemini, 2026-11-14. Reviewed by a human: NO.
 * Sources used: none
 */
import { DATA } from '../api/mockData.js';
import { ROLES, MAX_HISTORY, DEFAULT_SEED } from '../config.js';

export function createInitialMission(contractIndex = 1) {
  return {
    stage: 1,
    ci: contractIndex,
    oi: 0,
    L: 'medium',
    parts: [],
    nu: 1,
    mirror: true,
    hard: 0,
    seed: DEFAULT_SEED
  };
}

export const appState = {
  mission: createInitialMission(1),
  marginThreshold: 0.1,
  candidates: [],
  previousErrorCount: 0,
  isTeamMode: false,
  activeRole: 'Director',
  highScores: {},
  isFlying: false,
  selectedPartUid: null,
  canvasZoom: 0.8,
  undoHistory: [],
  activeDrag: null,
  dataSourceLabel: 'Offline sample'
};

try {
  appState.highScores = JSON.parse(localStorage.tm || '{}');
} catch {
  appState.highScores = {};
}

export function getNodeCategory(partId) {
  if (partId === 'tank') return 'tank';
  if (DATA.engines[partId]) return 'eng';
  if (DATA.parts[partId]?.g === 'bus') return 'bus';
  if (partId.startsWith('sol')) return 'sol';
  if (partId.startsWith('ant')) return 'ant';
  return 'sm';
}

export function getDimensionKey(partId) {
  if (partId === 'tank') return 'tank';
  if (DATA.engines[partId]) return partId === 'ion' ? 'ion' : 'eng';
  if (partId.startsWith('bus')) return 'bus';
  return partId;
}

export function getSubsystemGroup(partId) {
  const category = getNodeCategory(partId);
  return ['tank', 'eng', 'bus'].includes(category) ? 'stk' : DATA.parts[partId].g;
}

export function getAssetFilename(partId) {
  if (partId === 'tank') return 'part_tank';
  if (DATA.engines[partId]) return DATA.engines[partId].img;
  return partId;
}

export function canCurrentRoleEditPart(partId) {
  if (!appState.isTeamMode) return true;
  return ROLES[appState.activeRole].includes(getSubsystemGroup(partId));
}

export function getLockClass(subsystemGroup) {
  if (!appState.isTeamMode) return '';
  return ROLES[appState.activeRole].includes(subsystemGroup) ? '' : 'lock';
}

export function saveUndoSnapshot() {
  appState.undoHistory.push(JSON.stringify([appState.mission.parts, appState.mission.nu]));
  if (appState.undoHistory.length > MAX_HISTORY) {
    appState.undoHistory.shift();
  }
}

/* ---- Web Audio Synthesizer (off by default per Section 9: audio never autoplays) ---- */
export const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let isSoundOn = false;

  const init = () => {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
    masterGain = ctx.createGain();
    masterGain.gain.value = isSoundOn ? 0.45 : 0;
    masterGain.connect(ctx.destination);
  };

  const playTone = (freq, delay, duration, type = 'sine', volume = 0.2, endFreq = null) => {
    if (!ctx || !isSoundOn) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  return {
    init,
    isEnabled: () => isSoundOn,
    toggleMute() {
      init();
      isSoundOn = !isSoundOn;
      if (masterGain) masterGain.gain.value = isSoundOn ? 0.45 : 0;
      return isSoundOn;
    },
    click: () => playTone(660, 0, 0.05, 'square', 0.06),
    attach: () => {
      playTone(520, 0, 0.08, 'triangle', 0.14);
      playTone(780, 0.07, 0.1, 'triangle', 0.11);
    },
    remove: () => playTone(420, 0, 0.12, 'triangle', 0.12, 240),
    warn: () => {
      playTone(310, 0, 0.14, 'sawtooth', 0.07);
      playTone(310, 0.2, 0.14, 'sawtooth', 0.07);
    },
    tick: () => playTone(900, 0, 0.04, 'square', 0.05),
    launch: () => playTone(65, 0, 2.5, 'sawtooth', 0.14, 110),
    win: () => [523, 659, 784, 1047].forEach((f, i) => playTone(f, i * 0.14, 0.45, 'triangle', 0.16)),
    partial: () => [523, 659].forEach((f, i) => playTone(f, i * 0.2, 0.45, 'triangle', 0.14)),
    fail: () => playTone(120, 0, 1.0, 'sawtooth', 0.22, 35)
  };
})();