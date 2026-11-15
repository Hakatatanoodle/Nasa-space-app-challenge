/* File: js/main.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: YES Reviewed by Person C (Yochan)
 * Sources used: none
 */
import { CONTENT } from './content.js';
import { fetchMissionReferenceData } from './api/nasaService.js';
import {
  appState,
  createInitialMission,
  loadSavedMissionProgress,
  AudioEngine
} from './core/state.js';
import { buildStarterSpacecraft } from './core/engine.js';
import { $ } from './ui/domElements.js';
import { navigateToStage, renderHelpModal } from './ui/renderer.js';
import { bindGlobalControls } from './ui/controls.js';

function initBackgroundVideo() {
  const videoEl = $('#bg');
  if (!videoEl) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    videoEl.remove();
    return;
  }
  videoEl.onerror = () => videoEl.remove();
  videoEl.src = CONTENT.bgVideo;
  videoEl.play().catch(() => {});
}

function bindButtonSoundEffects() {
  let lastHovered = null;
  let lastHoverAt = 0;

  document.addEventListener('pointerover', e => {
    if (appState.activeDrag) return;
    const interactive = e.target.closest('button:not(:disabled), .card[role="button"]:not(.lkd), summary');
    if (!interactive || interactive === lastHovered) return;
    lastHovered = interactive;

    const now = performance.now();
    if (now - lastHoverAt < 65) return;
    lastHoverAt = now;
    AudioEngine.tick();
  });

  document.addEventListener('pointerout', e => {
    if (lastHovered && !e.relatedTarget?.closest?.('button, .card[role="button"], summary')) {
      lastHovered = null;
    }
  });
}

async function initApp() {
  initBackgroundVideo();

  $('#cr').textContent = CONTENT.bgCredit;
  $('#title-disclaimer').textContent = CONTENT.disclaimer;
  document.title = `${CONTENT.appName} — Space Mission Design Game`;
  $('#hn').textContent = CONTENT.appName;
  $('#tt').textContent = CONTENT.appName;
  $('#tg').textContent = CONTENT.tagline;
  renderHelpModal();

  const restored = loadSavedMissionProgress();
  if (!restored) {
    appState.mission = createInitialMission(1);
    buildStarterSpacecraft();
  }

  bindGlobalControls();
  bindButtonSoundEffects();
  AudioEngine.setMusic('landing');
  navigateToStage(1);

  try {
    const serviceResult = await fetchMissionReferenceData();
    appState.dataSourceLabel = serviceResult.sourceMode;
    appState.spaceWeather = serviceResult.spaceWeather;
    if (appState.mission.stage === 1) {
      navigateToStage(1);
    }
  } catch {}
}

initApp();