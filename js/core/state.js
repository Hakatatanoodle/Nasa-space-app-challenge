/* File: js/core/state.js
 * Owner: Person A (Asmin)
 * AI-assisted (update): Gemini, 2026-11-15 - distinct hover & click sci-fi button SFX balanced against background music. Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): Claude, 2026-11-15 - AudioEngine.pauseAll/resumeAll for the flight pause. Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): Claude, 2026-11-15 - win/loss tightening (outcome bands, audio, demos). Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): Claude, 2026-11-15 - added sanitizeLoadedMission() for share-code loading; saved-build names coerced to a string and capped at 60 characters; data import renamed to gameData.js. Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): ChatGPT, 2026-11-15 - initialized the margin threshold from DATA.marginPolicies.easy.v. Reviewed by a human: YES, Person C (Yochan).
 * Sources used: none
 */
import { DATA } from '../api/gameData.js';
import { CONTENT } from '../content.js';
import { MAX_HISTORY, DEFAULT_SEED, MAX_PARTS, ATTACHMENT_NODES } from '../config.js';

const MISSION_STORAGE_KEY = 'apogeeMissionState';
const SAVED_BUILDS_KEY = 'apogeeSavedBuilds';
const VOLUME_STORAGE_KEY = 'apogeeVolume';
const MAX_SAVED_BUILDS = 12;
const MAX_BUILD_NAME_LENGTH = 60;

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
  marginThreshold: DATA.marginPolicies.easy.v,
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
  if (Array.isArray(rawBuilds)) {
    appState.savedBuilds = rawBuilds
      .filter(b => b && typeof b === 'object')
      .map(b => ({ ...b, name: cleanBuildName(b.name) }));
  }
} catch {
  appState.savedBuilds = [];
}

function cleanBuildName(name) {
  return String(name ?? '').slice(0, MAX_BUILD_NAME_LENGTH);
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
  const name = cleanBuildName(customName.trim() || `${contractName} Build #${appState.savedBuilds.length + 1}`);
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

/* ---- Share-code validation (pure: no DOM, no appState) ---- */

// The builder world is 960 x 1100 px with a 360 px scrollable pad on every side (WORLD_PAD_PX in renderer.js).
const CANVAS_MIN_X = -360;
const CANVAS_MAX_X = 960 + 360;
const CANVAS_MIN_Y = -360;
const CANVAS_MAX_Y = 1100 + 360;
const MAX_UID = 1000000;
const MAX_SEED = 4294967295;
const MAX_NODE_NAME_LENGTH = 16;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));
const isValidPartId = id =>
  typeof id === 'string' && (id === 'tank' || hasOwn(DATA.parts, id) || hasOwn(DATA.engines, id));
const hasNode = (partId, nodeName) =>
  typeof nodeName === 'string' && ATTACHMENT_NODES[getNodeCategory(partId)].some(n => n[0] === nodeName);

/**
 * Turns a decoded design code into a clean mission object, or returns null if it cannot be trusted.
 * Only the fields that showDesignCodeModal serialises are kept (ci, oi, L, parts, nu, mirror, locked,
 * hard, seed; each part: u, id, x, y, rot, flip, par, cn, pn). Everything else is dropped.
 * The result is built from fresh object literals, so keys such as __proto__ or constructor never get copied.
 */
export function sanitizeLoadedMission(decoded) {
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return null;

  const ci = decoded.ci;
  if (!Number.isInteger(ci) || ci < 0 || ci >= DATA.contracts.length) return null;

  const oi = decoded.oi === undefined ? 0 : decoded.oi;
  if (!Number.isInteger(oi) || oi < 0 || oi >= DATA.contracts[ci].orbits.length) return null;

  const launcher = decoded.L;
  if (typeof launcher !== 'string' || !hasOwn(DATA.launchers, launcher)) return null;

  const hard = decoded.hard === undefined ? 0 : decoded.hard;
  if (hard !== 0 && hard !== 1) return null;

  const rawParts = decoded.parts;
  if (!Array.isArray(rawParts) || rawParts.length > MAX_PARTS) return null;

  const parts = [];
  const seenUids = new Set();
  let maxUid = 0;
  for (const raw of rawParts) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    if (!isValidPartId(raw.id)) return null;
    if (!Number.isInteger(raw.u) || raw.u < 0 || raw.u > MAX_UID || seenUids.has(raw.u)) return null;
    if (!isFiniteNumber(raw.x) || !isFiniteNumber(raw.y) || !isFiniteNumber(raw.rot)) return null;
    seenUids.add(raw.u);
    maxUid = Math.max(maxUid, raw.u);

    const part = {
      u: raw.u,
      id: raw.id,
      x: clampNumber(raw.x, CANVAS_MIN_X, CANVAS_MAX_X),
      y: clampNumber(raw.y, CANVAS_MIN_Y, CANVAS_MAX_Y),
      rot: ((Math.round(raw.rot) % 360) + 360) % 360,
      flip: raw.flip === 1 || raw.flip === true ? 1 : 0,
      par: Number.isInteger(raw.par) ? raw.par : null
    };
    if (typeof raw.cn === 'string') part.cn = raw.cn.slice(0, MAX_NODE_NAME_LENGTH);
    if (typeof raw.pn === 'string') part.pn = raw.pn.slice(0, MAX_NODE_NAME_LENGTH);
    parts.push(part);
  }

  // Parent links must point at a real part, use real attachment nodes and never form a loop
  // (a loop would hang getSubtreeUids). A part with a bad link is simply detached.
  const byUid = new Map(parts.map(p => [p.u, p]));
  const detach = part => {
    part.par = null;
    delete part.cn;
    delete part.pn;
  };
  for (const part of parts) {
    if (part.par === null) continue;
    const host = byUid.get(part.par);
    if (!host || host === part || !hasNode(part.id, part.cn) || !hasNode(host.id, part.pn)) detach(part);
  }
  for (const part of parts) {
    const visited = new Set([part.u]);
    let current = part;
    while (current.par !== null) {
      if (visited.has(current.par)) {
        detach(current);
        break;
      }
      visited.add(current.par);
      current = byUid.get(current.par);
    }
  }

  const rawNu = isFiniteNumber(decoded.nu) ? Math.floor(decoded.nu) : 0;
  return {
    ci,
    oi,
    L: launcher,
    parts,
    nu: Math.max(maxUid + 1, Math.min(rawNu, MAX_UID + 1)),
    mirror: typeof decoded.mirror === 'boolean' ? decoded.mirror : true,
    locked: typeof decoded.locked === 'boolean' ? decoded.locked : false,
    hard,
    seed: isFiniteNumber(decoded.seed) ? clampNumber(Math.trunc(decoded.seed), 0, MAX_SEED) : DEFAULT_SEED
  };
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
  const MAX_MUSIC_VOL = 0.34;
  const MAX_SFX_GAIN = 0.85;
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
  let pausedCountdownEl = null;
  let unlockBound = false;
  let lastHoverAt = 0;

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
    if (!ctx || ctx.state !== 'running') return;
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
    // Pre-launch terminal countdown (T-10 to lift-off)
    countdown() {
      if (!isSoundOn || masterLevel <= 0) return;
      const el = getTrackElement('countdown');
      if (!el || el.dataset.missing === '1') {
        playTone(720, 0, 0.14, 'sine', 0.16);
        return;
      }
      el.currentTime = 0;
      el.volume = Math.min(1, 0.85 * masterLevel);
      el.play().catch(() => playTone(720, 0, 0.14, 'sine', 0.16));
    },
    stopCountdown() {
      const el = trackElements.countdown;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
      pausedCountdownEl = null;
    },
    pauseAll() {
      if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      if (activeAudioEl && !activeAudioEl.paused) {
        pausedMusicEl = activeAudioEl;
        activeAudioEl.pause();
      }
      const cdEl = trackElements.countdown;
      if (cdEl && !cdEl.paused) {
        pausedCountdownEl = cdEl;
        cdEl.pause();
      }
    },
    resumeAll(playMusic = true) {
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (pausedMusicEl && playMusic && pausedMusicEl === activeAudioEl) pausedMusicEl.play().catch(() => {});
      if (pausedCountdownEl && playMusic) pausedCountdownEl.play().catch(() => {});
      pausedMusicEl = null;
      pausedCountdownEl = null;
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
    // Crisp high-frequency telemetry blip audible over background music
    hover: () => {
      const now = performance.now();
      if (now - lastHoverAt < 55) return;
      lastHoverAt = now;
      playTone(1320, 0, 0.038, 'sine', 0.14, 1760);
    },
    // Tactile dual-harmonic console switch click
    click: () => {
      playTone(980, 0, 0.055, 'triangle', 0.24, 540);
      playTone(1480, 0.015, 0.045, 'sine', 0.16, 1120);
    },
    attach: () => {
      playTone(540, 0, 0.08, 'triangle', 0.22);
      playTone(860, 0.06, 0.11, 'triangle', 0.19);
    },
    remove: () => playTone(440, 0, 0.13, 'triangle', 0.20, 220),
    warn: () => {
      playTone(320, 0, 0.14, 'sawtooth', 0.12);
      playTone(320, 0.19, 0.14, 'sawtooth', 0.12);
    },
    tick: () => playTone(1040, 0, 0.04, 'sine', 0.11),
    launch: () => playTone(68, 0, 2.5, 'sawtooth', 0.22, 115),
    win: () => {
      playTrack('win', true);
      [523, 659, 784, 1047].forEach((f, i) => playTone(f, i * 0.14, 0.45, 'triangle', 0.22));
    },
    partial: () => {
      [523, 659].forEach((f, i) => playTone(f, i * 0.2, 0.45, 'triangle', 0.19));
    },
    fail: () => {
      playTrack('loss', true);
      playTone(120, 0, 1.0, 'sawtooth', 0.26, 35);
    }
  };
})();