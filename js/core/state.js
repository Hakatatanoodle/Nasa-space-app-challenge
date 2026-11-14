/* File: js/core/state.js
 * Owner: Person A (Ashmin)
 * AI-assisted: YES — Gemini, 2026-11-14. Reviewed by a human: NO.
 * Sources used: none
 */
import { DATA } from '../api/mockData.js';
import { CONTENT } from '../content.js';
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
  canvasZoom: 0.9,
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

/* ---- Web Audio Synthesizer & Smooth Crossfading Screen Music Controller ---- */
export const AudioEngine = (() => {
  const TARGET_VOLUME = 0.36;
  const CROSSFADE_MS = 700;

  let ctx = null;
  let masterGain = null;
  let isSoundOn = true; // Enabled by default per user request
  let activeTrackKey = 'landing';
  let activeAudioEl = null;
  let unlockBound = false;

  const trackElements = {};
  const fadeTimers = new WeakMap();

  const fadeAudio = (audio, targetVol, durationMs, onDone = null) => {
    if (!audio) return;
    const prevRaf = fadeTimers.get(audio);
    if (prevRaf) cancelAnimationFrame(prevRaf);

    const startVol = audio.volume;
    const startTime = performance.now();

    const step = now => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      // Smooth ease-in-out curve for unnoticeable transitions
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      audio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * eased));

      if (progress < 1) {
        fadeTimers.set(audio, requestAnimationFrame(step));
      } else {
        fadeTimers.delete(audio);
        if (onDone) onDone();
      }
    };

    fadeTimers.set(audio, requestAnimationFrame(step));
  };

  const getTrackElement = key => {
    if (trackElements[key]) return trackElements[key];
    const src = CONTENT.audioTracks?.[key];
    if (!src) return null;

    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.loop = key === 'landing' || key === 'design';
    audio.volume = 0;
    audio.onerror = () => {
      audio.dataset.missing = '1';
    };
    trackElements[key] = audio;
    return audio;
  };

  const fadeOutAndStop = audio => {
    if (!audio) return;
    fadeAudio(audio, 0, CROSSFADE_MS, () => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const bindAutoplayUnlock = () => {
    if (unlockBound) return;
    unlockBound = true;

    const unlock = () => {
      init();
      if (isSoundOn && activeTrackKey) {
        const el = getTrackElement(activeTrackKey);
        if (el && el.dataset.missing !== '1' && el.paused) {
          el.volume = 0;
          el.play()
            .then(() => {
              fadeAudio(el, TARGET_VOLUME, CROSSFADE_MS);
              cleanup();
            })
            .catch(() => {});
        } else if (el && !el.paused) {
          cleanup();
        }
      } else {
        cleanup();
      }
    };

    const cleanup = () => {
      ['pointerdown', 'keydown', 'touchstart'].forEach(evt =>
        document.removeEventListener(evt, unlock, true)
      );
    };

    ['pointerdown', 'keydown', 'touchstart'].forEach(evt =>
      document.addEventListener(evt, unlock, true)
    );
  };

  const playTrack = (key, forceRestart = false) => {
    activeTrackKey = key;
    if (!isSoundOn) return;

    if (!key) {
      if (activeAudioEl) {
        fadeOutAndStop(activeAudioEl);
        activeAudioEl = null;
      }
      return;
    }

    const nextEl = getTrackElement(key);
    if (!nextEl || nextEl.dataset.missing === '1') {
      if (activeAudioEl) {
        fadeOutAndStop(activeAudioEl);
        activeAudioEl = null;
      }
      return;
    }

    // Already playing this exact track smoothly — do not interrupt or restart it
    if (activeAudioEl === nextEl && !nextEl.paused && !forceRestart) {
      fadeAudio(nextEl, TARGET_VOLUME, CROSSFADE_MS);
      return;
    }

    if (activeAudioEl && activeAudioEl !== nextEl) {
      fadeOutAndStop(activeAudioEl);
    }

    activeAudioEl = nextEl;
    if (forceRestart) nextEl.currentTime = 0;
    nextEl.volume = 0;
    nextEl.play()
      .then(() => fadeAudio(nextEl, TARGET_VOLUME, CROSSFADE_MS))
      .catch(() => bindAutoplayUnlock());
  };

  const init = () => {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.value = isSoundOn ? 0.45 : 0;
        masterGain.connect(ctx.destination);
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };

  const playTone = (freq, delay, duration, type = 'sine', volume = 0.2, endFreq = null) => {
    if (!isSoundOn) return;
    init();
    if (!ctx) return;
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
    setMusic: (key, forceRestart = false) => playTrack(key, forceRestart),
    toggleMute() {
      isSoundOn = !isSoundOn;
      init();
      if (masterGain) masterGain.gain.value = isSoundOn ? 0.45 : 0;
      if (isSoundOn) {
        playTrack(activeTrackKey || 'landing');
      } else if (activeAudioEl) {
        fadeOutAndStop(activeAudioEl);
        activeAudioEl = null;
      }
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
    win: () => {
      playTrack('win', true);
      [523, 659, 784, 1047].forEach((f, i) => playTone(f, i * 0.14, 0.45, 'triangle', 0.16));
    },
    partial: () => {
      playTrack('win', true);
      [523, 659].forEach((f, i) => playTone(f, i * 0.2, 0.45, 'triangle', 0.14));
    },
    fail: () => {
      playTrack('loss', true);
      playTone(120, 0, 1.0, 'sawtooth', 0.22, 35);
    }
  };
})();