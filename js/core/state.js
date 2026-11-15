/* File: js/core/state.js
 * Owner: Person A (Ashmin)
 * AI-assisted (update): Claude, 2026-11-15 - AudioEngine.pauseAll/resumeAll for the flight pause. Reviewed by a human: NO.
 * AI-assisted (update): Claude, 2026-11-15 - win/loss tightening (outcome bands, audio, demos). Reviewed by a human: NO.
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: Yes Reviewed by Person C (Yochan).
 * Sources used: none
 */
import { DATA } from '../api/mockData.js';
import { CONTENT } from '../content.js';
import { MAX_HISTORY, DEFAULT_SEED } from '../config.js';

const MISSION_STORAGE_KEY = 'apogeeMissionState';
const SAVED_BUILDS_KEY = 'apogeeSavedBuilds';
const VOLUME_STORAGE_KEY = 'apogeeVolume';
const MAX_SAVED_BUILDS = 12;

export function createInitialMission(contractIndex = 1) {
  return {
    stage: 1,
    ci: contractIndex,
    oi: 0,
    L: 'medium',
    parts: [],
    nu: 1,
    mirror: true,
    locked: false,
    hard: 0,
    seed: DEFAULT_SEED
  };
}

export const appState = {
  mission: createInitialMission(1),
  marginThreshold: 0.1,
  candidates: [],
  savedBuilds: [],
  previousErrorCount: 0,
  highScores: {},
  isFlying: false,
  selectedPartUid: null,
  canvasZoom: 0.9,
  undoHistory: [],
  activeDrag: null,
  dataSourceLabel: 'Offline sample',
  spaceWeather: {
    isLive: false,
    flareClass: 'M1.4 (Baseline)',
    flareCount: 3,
    cmeCount: 2,
    stormLevel: 'Moderate',
    radiationMultiplier: 1.0,
    summary: 'Solar wind & flare baseline (offline fallback — check internet connection for live NASA DONKI telemetry).',
    src: 'SIMPLIFIED_FOR_GAMEPLAY'
  }
};

try {
  appState.highScores = JSON.parse(localStorage.tm || '{}');
} catch {
  appState.highScores = {};
}

try {
  const rawBuilds = JSON.parse(localStorage[SAVED_BUILDS_KEY] || '[]');
  if (Array.isArray(rawBuilds)) appState.savedBuilds = rawBuilds;
} catch {
  appState.savedBuilds = [];
}

function persistSavedBuilds() {
  try {
    localStorage[SAVED_BUILDS_KEY] = JSON.stringify(appState.savedBuilds);
  } catch {}
}

export function saveNamedBuild(customName = '') {
  const { parts, nu, L, oi, ci, hard, seed, d } = appState.mission;
  if (!parts.length) return { ok: false, message: 'Add at least one part before saving a build.' };

  const contractName = DATA.contracts[ci]?.n || 'Mission';
  const name = customName.trim() || `${contractName} Build #${appState.savedBuilds.length + 1}`;
  const entry = {
    id: `build_${Date.now()}`,
    name,
    savedAt: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    mission: { parts: JSON.parse(JSON.stringify(parts)), nu, L, oi, ci, hard, seed },
    summary: {
      contract: contractName,
      orbit: DATA.contracts[ci]?.orbits[oi]?.n || '',
      launcher: DATA.launchers[L]?.n || L,
      massKg: d ? Math.round(d.m0) : 0,
      dvMs: d ? Math.round(d.dv) : 0,
      costM: d ? Math.round(d.cost) : 0,
      partCount: parts.length
    }
  };

  appState.savedBuilds.unshift(entry);
  if (appState.savedBuilds.length > MAX_SAVED_BUILDS) {
    appState.savedBuilds.length = MAX_SAVED_BUILDS;
  }
  persistSavedBuilds();
  return { ok: true, entry };
}

export function deleteSavedBuild(buildId) {
  appState.savedBuilds = appState.savedBuilds.filter(b => b.id !== buildId);
  persistSavedBuilds();
}

export function saveMissionProgress() {
  try {
    const { d, res, ...serializable } = appState.mission;
    localStorage[MISSION_STORAGE_KEY] = JSON.stringify({
      mission: serializable,
      candidates: appState.candidates
    });
  } catch {}
}

export function loadSavedMissionProgress() {
  try {
    const raw = localStorage[MISSION_STORAGE_KEY];
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (saved && saved.mission && Array.isArray(saved.mission.parts) && saved.mission.parts.length > 0) {
      const validParts = saved.mission.parts.every(
        p => p.id === 'tank' || DATA.parts[p.id] || DATA.engines[p.id]
      );
      if (validParts && DATA.contracts[saved.mission.ci] && DATA.launchers[saved.mission.L]) {
        appState.mission = { ...createInitialMission(saved.mission.ci), ...saved.mission, stage: 1 };
        if (Array.isArray(saved.candidates)) {
          appState.candidates = saved.candidates.slice(0, 3);
        }
        return true;
      }
    }
  } catch {}
  return false;
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

export function getAssetFilename(partId) {
  if (partId === 'tank') return 'part_tank';
  if (DATA.engines[partId]) return DATA.engines[partId].img;
  return partId;
}

export function saveUndoSnapshot() {
  appState.undoHistory.push(JSON.stringify([appState.mission.parts, appState.mission.nu]));
  if (appState.undoHistory.length > MAX_HISTORY) {
    appState.undoHistory.shift();
  }
}

/* ---- Web Audio Synthesizer & Smooth Crossfading Screen Music Controller ---- */
export const AudioEngine = (() => {
  const MAX_MUSIC_VOL = 0.48;
  const MAX_SFX_GAIN = 0.6;
  const CROSSFADE_MS = 700;

  let savedLevel = 0.75;
  try {
    const raw = parseFloat(localStorage[VOLUME_STORAGE_KEY]);
    if (!Number.isNaN(raw) && raw >= 0 && raw <= 1) savedLevel = raw;
  } catch {}

  let ctx = null;
  let masterGain = null;
  let masterLevel = savedLevel;
  let lastNonZeroLevel = savedLevel > 0 ? savedLevel : 0.75;
  let isSoundOn = savedLevel > 0;
  let activeTrackKey = 'landing';
  let activeAudioEl = null;
  let pausedMusicEl = null;
  let unlockBound = false;

  const trackElements = {};
  const fadeTimers = new WeakMap();

  const getMusicTargetVolume = () => (isSoundOn ? MAX_MUSIC_VOL * masterLevel : 0);
  const getSfxTargetGain = () => (isSoundOn ? MAX_SFX_GAIN * masterLevel : 0);

  const persistVolume = () => {
    try {
      localStorage[VOLUME_STORAGE_KEY] = String(masterLevel);
    } catch {}
  };

  const fadeAudio = (audio, targetVol, durationMs, onDone = null) => {
    if (!audio) return;
    const prevRaf = fadeTimers.get(audio);
    if (prevRaf) cancelAnimationFrame(prevRaf);

    const startVol = audio.volume;
    const startTime = performance.now();

    const step = now => {
      const progress = Math.min(1, (now - startTime) / durationMs);
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
              fadeAudio(el, getMusicTargetVolume(), CROSSFADE_MS);
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

    if (activeAudioEl === nextEl && !nextEl.paused && !forceRestart) {
      fadeAudio(nextEl, getMusicTargetVolume(), CROSSFADE_MS);
      return;
    }

    if (activeAudioEl && activeAudioEl !== nextEl) {
      fadeOutAndStop(activeAudioEl);
    }

    activeAudioEl = nextEl;
    if (forceRestart) nextEl.currentTime = 0;
    nextEl.volume = 0;
    nextEl.play()
      .then(() => fadeAudio(nextEl, getMusicTargetVolume(), CROSSFADE_MS))
      .catch(() => bindAutoplayUnlock());
  };

  const init = () => {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.value = getSfxTargetGain();
        masterGain.connect(ctx.destination);
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };

  const playTone = (freq, delay, duration, type = 'sine', volume = 0.2, endFreq = null) => {
    if (!isSoundOn || masterLevel <= 0) return;
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
    getVolume: () => Math.round(masterLevel * 100),
    setVolume(percent) {
      const clamped = Math.max(0, Math.min(100, Number(percent) || 0)) / 100;
      masterLevel = clamped;
      if (clamped > 0) {
        lastNonZeroLevel = clamped;
        isSoundOn = true;
      } else {
        isSoundOn = false;
      }
      persistVolume();
      init();
      if (masterGain) masterGain.gain.value = getSfxTargetGain();

      if (isSoundOn) {
        if (activeAudioEl && !activeAudioEl.paused) {
          const prevRaf = fadeTimers.get(activeAudioEl);
          if (prevRaf) cancelAnimationFrame(prevRaf);
          activeAudioEl.volume = getMusicTargetVolume();
        } else {
          playTrack(activeTrackKey || 'landing');
        }
      } else if (activeAudioEl) {
        fadeOutAndStop(activeAudioEl);
        activeAudioEl = null;
      }
      return { isSoundOn, volumePct: Math.round(masterLevel * 100) };
    },
    setMusic: (key, forceRestart = false) => playTrack(key, forceRestart),
    // Flight pause: freeze sound effects and any playing music track.
    pauseAll() {
      if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      if (activeAudioEl && !activeAudioEl.paused) {
        pausedMusicEl = activeAudioEl;
        activeAudioEl.pause();
      }
    },
    // Resume after a pause. Pass false to forget the paused track instead of playing it (flight aborted).
    resumeAll(playMusic = true) {
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (pausedMusicEl && playMusic && pausedMusicEl === activeAudioEl) pausedMusicEl.play().catch(() => {});
      pausedMusicEl = null;
    },
    toggleMute() {
      isSoundOn = !isSoundOn;
      if (isSoundOn && masterLevel <= 0) {
        masterLevel = lastNonZeroLevel;
      }
      persistVolume();
      init();
      if (masterGain) masterGain.gain.value = getSfxTargetGain();
      if (isSoundOn) {
        playTrack(activeTrackKey || 'landing');
      } else if (activeAudioEl) {
        fadeOutAndStop(activeAudioEl);
        activeAudioEl = null;
      }
      return { isSoundOn, volumePct: Math.round(masterLevel * 100) };
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
      // Partial success is not a win: short two-note chime only, no victory track.
      [523, 659].forEach((f, i) => playTone(f, i * 0.2, 0.45, 'triangle', 0.14));
    },
    fail: () => {
      playTrack('loss', true);
      playTone(120, 0, 1.0, 'sawtooth', 0.22, 35);
    }
  };
})();