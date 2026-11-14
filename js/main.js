/* File: js/main.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-14. Reviewed by a human: NO.
 * Sources used: none
 */
import { CONTENT } from './content.js';
import { fetchMissionReferenceData } from './api/nasaService.js';
import { appState, createInitialMission, AudioEngine } from './core/state.js';
import { buildStarterSpacecraft } from './core/engine.js';
import { $ } from './ui/domElements.js';
import { navigateToStage } from './ui/renderer.js';
import { bindGlobalControls } from './ui/controls.js';

function initBackgroundVideo() {
  const videoEl = $('#bg');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    videoEl.remove();
    return;
  }
  videoEl.onerror = () => videoEl.remove();
  videoEl.src = CONTENT.bgVideo;
  videoEl.play().catch(() => {});
}

async function initApp() {
  initBackgroundVideo();

  const serviceResult = await fetchMissionReferenceData();
  appState.dataSourceLabel = serviceResult.sourceMode;

  $('#cr').textContent = CONTENT.bgCredit;
  $('#title-disclaimer').textContent = CONTENT.disclaimer;
  document.title = `${CONTENT.appName} — Space Mission Design Game`;
  $('#hn').textContent = CONTENT.appName;
  $('#tt').textContent = CONTENT.appName;
  $('#tg').textContent = CONTENT.tagline;
  $('#help-body').innerHTML = CONTENT.helpHtml;

  appState.mission = createInitialMission(1);
  buildStarterSpacecraft();
  bindGlobalControls();
  AudioEngine.setMusic('landing');
  navigateToStage(1);
}

initApp();