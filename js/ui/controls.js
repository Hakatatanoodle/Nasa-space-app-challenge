/* File: js/ui/controls.js
 * Owner: Person B (Saurav)
 * AI-assisted (update): Claude, 2026-11-15 - responsive pass: header "More" toggle for small screens; touch palette no longer grabs parts while the person scrolls, and a scroll-cancelled tap no longer places a part. Reviewed by a human: NO.
 * AI-assisted (update): Claude, 2026-11-15 - centred flight menu (M opens it; Home / Pause P / Resume X / Restart R). Reviewed by a human: NO.
 * AI-assisted (update): Claude, 2026-11-15 - win/loss tightening (outcome bands, audio, demos). Reviewed by a human: NO.
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: YES Reviewd by Person C (Yochan)
 * AI-assisted (update): Gemini, 2026-11-15 - rAF-throttled 60fps drag pipeline and clean snap nodes. Reviewed by a human: NO.
 * Sources used: none
 */
import { DATA } from '../api/mockData.js';
import { isContractOpen, isDeveloperMode, toggleDeveloperMode, resetCareer } from '../core/career.js';
import { ATTACHMENT_NODES, MAX_PARTS, SNAP_RADIUS_PX } from '../config.js';
import {
  appState,
  getNodeCategory,
  saveUndoSnapshot,
  saveMissionProgress,
  saveNamedBuild,
  AudioEngine
} from '../core/state.js';
import {
  findPartByUid,
  getNodeWorldPosition,
  getSubtreeUids,
  getOccupiedNodes,
  createPartInstance,
  deletePartSubtree,
  attachParts,
  mirrorPartIfEnabled,
  autoAttachPart,
  buildStarterSpacecraft,
  buildFailingDemoSpacecraft,
  buildDeveloperPrebuilt,
  isStackNode
} from '../core/engine.js';
import { $, showToast } from './domElements.js';
import {
  navigateToStage,
  renderObjectiveStage,
  refreshBuilderView,
  centerBuilderCanvas,
  autoFitBuilderCanvas,
  updateBuilderLiveDrag,
  updateCareerButton,
  showSavedBuildsModal,
  showReviewModal,
  showCompareModal,
  showDesignCodeModal,
  showCareerModal,
  startLaunchSequence,
  abortLaunchSequence,
  pauseFlight,
  resumeFlight,
  isFlightPaused,
  restartLaunchSequence,
  openFlightMenu,
  closeFlightMenu
} from './renderer.js';

const DEVELOPER_CHEAT_CODE = 'Eventhorizon';

// Which way does this element scroll natively on touch screens? 'x' (pan-x), 'y' (pan-y) or '' (none / both).
function getTouchScrollAxis(el) {
  const action = getComputedStyle(el).touchAction;
  if (action === 'pan-x') return 'x';
  if (action === 'pan-y') return 'y';
  return '';
}

function clientToWorldCoords(event) {
  const rect = $('#world').getBoundingClientRect();
  return [
    (event.clientX - rect.left) / appState.canvasZoom,
    (event.clientY - rect.top) / appState.canvasZoom
  ];
}

function rotateSelectedPart(direction) {
  if (appState.mission.locked) return showToast('Design is locked. Click "Design locked: ON" to unlock.');
  const part = appState.selectedPartUid && findPartByUid(appState.selectedPartUid);
  if (!part) return;

  saveUndoSnapshot();
  const angle = direction * 90;
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const pivot = part.par != null ? getNodeWorldPosition(part, part.cn) : [part.x, part.y];

  getSubtreeUids(part.u).forEach(uid => {
    const q = findPartByUid(uid);
    const relX = q.x - pivot[0];
    const relY = q.y - pivot[1];
    q.x = pivot[0] + relX * cos - relY * sin;
    q.y = pivot[1] + relX * sin + relY * cos;
    q.rot = (q.rot + angle + 360) % 360;
  });

  AudioEngine.click();
  refreshBuilderView();
}

function flipSelectedPart() {
  if (appState.mission.locked) return showToast('Design is locked. Click "Design locked: ON" to unlock.');
  const part = appState.selectedPartUid && findPartByUid(appState.selectedPartUid);
  if (!part) return;

  saveUndoSnapshot();
  const pivotX = part.par != null ? getNodeWorldPosition(part, part.cn)[0] : part.x;

  getSubtreeUids(part.u).forEach(uid => {
    const q = findPartByUid(uid);
    q.x = 2 * pivotX - q.x;
    q.flip ^= 1;
    q.rot = (360 - q.rot) % 360;
  });

  AudioEngine.click();
  refreshBuilderView();
}

function deleteSelectedPart() {
  if (appState.mission.locked) return showToast('Design is locked. Click "Design locked: ON" to unlock.');
  const part = appState.selectedPartUid && findPartByUid(appState.selectedPartUid);
  if (!part) return;

  saveUndoSnapshot();
  deletePartSubtree(part.u);
  appState.selectedPartUid = null;
  AudioEngine.remove();
  refreshBuilderView();
}

function undoLastAction() {
  if (appState.mission.locked) return showToast('Design is locked. Click "Design locked: ON" to unlock.');
  const snapshot = appState.undoHistory.pop();
  if (!snapshot) return showToast('Nothing to undo.');

  [appState.mission.parts, appState.mission.nu] = JSON.parse(snapshot);
  appState.selectedPartUid = null;
  refreshBuilderView();
}

function activateDeveloperMode() {
  const enabled = toggleDeveloperMode();
  updateCareerButton();
  if (appState.mission.stage === 1) renderObjectiveStage();
  showToast(
    enabled
      ? 'Developer Mode active: all destinations & 3★ prebuilt rockets unlocked in My builds.'
      : 'Developer Mode off: standard Career locks restored.'
  );
}

function closeOpenModals() {
  $('#rev').hidden = true;
  $('#help').hidden = true;
  closeFlightMenu();
}

function goHome() {
  abortLaunchSequence();
  closeOpenModals();
  AudioEngine.click();
  $('#title').hidden = false;
  AudioEngine.setMusic('landing');
}

function syncAudioControls({ isSoundOn, volumePct }) {
  const muteBtn = $('#mute');
  const volSlider = $('#vol');
  const wrapper = muteBtn?.closest('.audio-control');

  if (muteBtn) {
    muteBtn.textContent = `Sound: ${isSoundOn ? 'on' : 'off'}`;
    muteBtn.classList.toggle('sound-on', isSoundOn);
  }
  if (volSlider) {
    volSlider.value = isSoundOn ? String(volumePct) : '0';
    volSlider.title = `Master volume (${isSoundOn ? volumePct : 0}%)`;
  }
  if (wrapper) {
    wrapper.classList.toggle('is-muted', !isSoundOn);
  }
}

export function bindGlobalControls() {
  syncAudioControls({
    isSoundOn: AudioEngine.isEnabled(),
    volumePct: AudioEngine.getVolume()
  });

  document.addEventListener('dragstart', e => {
    e.preventDefault();
  });

  $('#brand-home')?.addEventListener('click', e => {
    e.preventDefault();
    goHome();
  });

  // Small screens: the "More" button folds the career / sound / share / help buttons in and out of the header
  const appHeader = $('#app-header');
  const setHeaderTools = open => {
    appHeader?.classList.toggle('tools-open', open);
    $('#hdr-more')?.setAttribute('aria-expanded', String(open));
  };
  $('#hdr-more')?.addEventListener('click', () => {
    AudioEngine.click();
    setHeaderTools(!appHeader.classList.contains('tools-open'));
  });
  // Choosing Career / Share / How to play closes the panel; Sound stays open so the volume can be adjusted
  $('#hdr-tools')?.addEventListener('click', e => {
    if (e.target.closest('#car, #copy, #hp')) setHeaderTools(false);
  });

  // Flight menu: the header Menu button opens a centred panel with Home / Pause / Resume / Restart
  const flightMenu = $('#flightmenu');
  $('#fm-open')?.addEventListener('click', () => {
    AudioEngine.click();
    openFlightMenu();
  });
  $('#fm-close')?.addEventListener('click', () => {
    AudioEngine.click();
    closeFlightMenu();
  });
  $('#fm-home')?.addEventListener('click', goHome);
  $('#fm-pause')?.addEventListener('click', () => {
    AudioEngine.click();
    pauseFlight();
  });
  $('#fm-resume')?.addEventListener('click', () => {
    AudioEngine.click();
    resumeFlight();
  });
  $('#fm-restart')?.addEventListener('click', () => {
    AudioEngine.click();
    restartLaunchSequence();
  });
  flightMenu?.addEventListener('click', e => {
    if (e.target === flightMenu) closeFlightMenu();
  });
  flightMenu?.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const items = [...flightMenu.querySelectorAll('button:not(:disabled)')];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!items.includes(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName;
    if (/SELECT|TEXTAREA/.test(tag) || (tag === 'INPUT' && e.target.type !== 'range')) return;
    const key = (e.key || '').toLowerCase();

    if (key === 'm' && !$('#fm-open').hidden) {
      e.preventDefault();
      AudioEngine.click();
      if ($('#flightmenu').hidden) openFlightMenu();
      else closeFlightMenu();
      return;
    }
    if (e.key === 'Backspace' && !$('#fm-open').hidden) {
      e.preventDefault();
      goHome();
      return;
    }
    if (!appState.isFlying) return;

    if (key === 'p') {
      e.preventDefault();
      if (!isFlightPaused()) {
        AudioEngine.click();
        pauseFlight();
      }
    } else if (key === 'x') {
      e.preventDefault();
      if (isFlightPaused()) {
        AudioEngine.click();
        resumeFlight();
      }
    } else if (key === 'r') {
      e.preventDefault();
      AudioEngine.click();
      restartLaunchSequence();
    }
  });

  let logoClicks = 0;
  let logoClickTimer = null;
  $('#tt')?.addEventListener('click', () => {
    logoClicks++;
    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => { logoClicks = 0; }, 2200);
    if (logoClicks >= 5) {
      logoClicks = 0;
      activateDeveloperMode();
    }
  });

  let keyBuffer = '';
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeOpenModals();
      setHeaderTools(false);
      return;
    }
    if (/SELECT|TEXTAREA|INPUT/.test(e.target.tagName)) return;
    if (e.key && e.key.length === 1) {
      keyBuffer = (keyBuffer + e.key).slice(-DEVELOPER_CHEAT_CODE.length);
      if (keyBuffer === DEVELOPER_CHEAT_CODE) {
        keyBuffer = '';
        activateDeveloperMode();
      }
    }
  });

  let dragRafPending = false;
  let latestDragEvent = null;

  document.addEventListener('pointerdown', e => {
    if (appState.mission.stage !== 2) return;

    const placedEl = e.target.closest('.pt[data-u]');
    const paletteEl = e.target.closest('[data-p]');
    if (!placedEl && !paletteEl) return;
    e.preventDefault();

    if (appState.mission.locked) {
      if (placedEl) {
        const part = findPartByUid(+placedEl.dataset.u);
        if (part && appState.selectedPartUid !== part.u) {
          appState.selectedPartUid = part.u;
          AudioEngine.click();
          refreshBuilderView();
        }
      }
      showToast('Design is locked. Click "Design locked: ON" to customize parts.');
      return;
    }

    if (paletteEl) {
      appState.activeDrag = {
        nid: paletteEl.dataset.p,
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        mv: false,
        // On touch screens the palette scrolls natively along one axis (pan-x tray or pan-y list).
        // Remember which, so a swipe along that axis scrolls instead of dragging a part out.
        scrollAxis: e.pointerType === 'touch' ? getTouchScrollAxis(paletteEl) : ''
      };
      return;
    }

    const part = findPartByUid(+placedEl.dataset.u);
    if (!part) return;

    if (appState.selectedPartUid !== part.u) {
      appState.selectedPartUid = part.u;
      AudioEngine.click();
      refreshBuilderView();
    }

    appState.activeDrag = {
      u: part.u,
      pointerId: e.pointerId,
      w0: clientToWorldCoords(e),
      x: e.clientX,
      y: e.clientY,
      mv: false
    };
  });

  const processDragFrame = () => {
    dragRafPending = false;
    const e = latestDragEvent;
    const drag = appState.activeDrag;
    if (!e || !drag) return;

    if (!drag.mv) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;

      if (drag.nid && drag.scrollAxis) {
        const movesAlongScrollAxis = drag.scrollAxis === 'x'
          ? Math.abs(e.clientX - drag.x) > Math.abs(e.clientY - drag.y)
          : Math.abs(e.clientY - drag.y) > Math.abs(e.clientX - drag.x);
        if (movesAlongScrollAxis) {
          appState.activeDrag = null;
          return;
        }
      }

      if (drag.nid) {
        const partId = drag.nid;
        const hasCategory = cat => appState.mission.parts.some(p => getNodeCategory(p.id) === cat);

        if (hasCategory('bus') && getNodeCategory(partId) === 'bus') {
          appState.activeDrag = null;
          return showToast('One bus per ship. Click a different bus in the list to swap it.');
        }
        if (hasCategory('eng') && getNodeCategory(partId) === 'eng') {
          appState.activeDrag = null;
          return showToast('One main engine. Click a different engine in the list to swap it.');
        }
        if (appState.mission.parts.length >= MAX_PARTS) {
          appState.activeDrag = null;
          return showToast(`Part limit reached (${MAX_PARTS}).`);
        }

        saveUndoSnapshot();
        const worldPos = clientToWorldCoords(e);
        const newPart = createPartInstance(partId, worldPos[0], worldPos[1]);
        appState.selectedPartUid = newPart.u;
        appState.activeDrag = {
          u: newPart.u,
          pointerId: e.pointerId,
          w0: worldPos,
          x: e.clientX,
          y: e.clientY,
          mv: true
        };
        refreshBuilderView();
      } else {
        saveUndoSnapshot();
        const rootPart = findPartByUid(drag.u);
        if (!rootPart) {
          appState.activeDrag = null;
          return;
        }
        rootPart.par = null;
        drag.mv = true;
        refreshBuilderView();
      }

      appState.activeDrag.orig = {};
      getSubtreeUids(appState.activeDrag.u).forEach(uid => {
        const q = findPartByUid(uid);
        appState.activeDrag.orig[uid] = [q.x, q.y];
      });
      AudioEngine.click();
    }

    const activeDrag = appState.activeDrag;
    const worldPos = clientToWorldCoords(e);
    const dx = worldPos[0] - activeDrag.w0[0];
    const dy = worldPos[1] - activeDrag.w0[1];
    const draggedPart = findPartByUid(activeDrag.u);
    if (!draggedPart) return;

    getSubtreeUids(activeDrag.u).forEach(uid => {
      const q = findPartByUid(uid);
      q.x = activeDrag.orig[uid][0] + dx;
      q.y = activeDrag.orig[uid][1] + dy;
    });

    activeDrag.sn = null;
    if (getNodeCategory(draggedPart.id) !== 'bus') {
      const occupied = getOccupiedNodes();
      const draggedTree = new Set(getSubtreeUids(activeDrag.u));
      let closestDist = SNAP_RADIUS_PX;

      const hasChildren = appState.mission.parts.some(q => q.par === draggedPart.u);
      const origFlip = draggedPart.flip;
      const origRot = draggedPart.rot;

      ATTACHMENT_NODES[getNodeCategory(draggedPart.id)].forEach(([childNode]) => {
        if (occupied.has(`${draggedPart.u}:${childNode}`)) return;

        appState.mission.parts.forEach(host => {
          if (draggedTree.has(host.u)) return;

          ATTACHMENT_NODES[getNodeCategory(host.id)].forEach(([hostNode]) => {
            if (occupied.has(`${host.u}:${hostNode}`) || isStackNode(childNode) !== isStackNode(hostNode)) return;

            if (!isStackNode(childNode) && !hasChildren) {
              draggedPart.rot = 0;
              draggedPart.flip = hostNode.startsWith('L') ? 1 : 0;
            }

            const a = getNodeWorldPosition(draggedPart, childNode);
            const b = getNodeWorldPosition(host, hostNode);
            const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);

            draggedPart.flip = origFlip;
            draggedPart.rot = origRot;

            if (distance < closestDist) {
              closestDist = distance;
              activeDrag.sn = { h: host.u, hn: hostNode, cn: childNode };
            }
          });
        });
      });

      if (activeDrag.sn) {
        attachParts(draggedPart, activeDrag.sn.cn, findPartByUid(activeDrag.sn.h), activeDrag.sn.hn);
        draggedPart.par = null;
      }
    }

    updateBuilderLiveDrag();
  };

  document.addEventListener('pointermove', e => {
    const drag = appState.activeDrag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    latestDragEvent = e;
    if (!dragRafPending) {
      dragRafPending = true;
      requestAnimationFrame(processDragFrame);
    }
  });

  const finishPointerDrag = e => {
    const drag = appState.activeDrag;
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
    appState.activeDrag = null;
    latestDragEvent = null;

    if (!drag.mv) {
      if (drag.nid && e.type !== 'pointercancel') {
        const result = autoAttachPart(drag.nid);
        if (!result.ok) showToast(result.message);
        else AudioEngine.attach();
      }
      refreshBuilderView();
      return;
    }

    const paletteRect = $('#pal').getBoundingClientRect();
    const droppedOnPalette =
      e.clientX > paletteRect.left &&
      e.clientX < paletteRect.right &&
      e.clientY > paletteRect.top &&
      e.clientY < paletteRect.bottom;

    if (droppedOnPalette) {
      deletePartSubtree(drag.u);
      appState.selectedPartUid = null;
      AudioEngine.remove();
    } else if (drag.sn) {
      const part = findPartByUid(drag.u);
      attachParts(part, drag.sn.cn, findPartByUid(drag.sn.h), drag.sn.hn);
      mirrorPartIfEnabled(part);
      AudioEngine.attach();
    }

    refreshBuilderView();
  };

  document.addEventListener('pointerup', finishPointerDrag);
  document.addEventListener('pointercancel', finishPointerDrag);

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const cardEl = e.target.closest('.card[data-a]');
      if (cardEl) {
        e.preventDefault();
        cardEl.click();
        return;
      }
      const placedPartEl = e.target.closest('.pt[data-u]');
      if (placedPartEl) {
        e.preventDefault();
        appState.selectedPartUid = +placedPartEl.dataset.u;
        refreshBuilderView();
        return;
      }
    }

    if (appState.mission.stage !== 2 || /SELECT|TEXTAREA|INPUT/.test(e.target.tagName)) return;
    const key = e.key.toLowerCase();

    if (e.ctrlKey || e.metaKey) {
      if (key === 'z') {
        e.preventDefault();
        undoLastAction();
      }
      return;
    }

    if (key === 'r') rotateSelectedPart(e.shiftKey ? -1 : 1);
    else if (key === 'f') flipSelectedPart();
    else if (key === 'delete' || key === 'backspace') {
      e.preventDefault();
      deleteSelectedPart();
    }
  });

  let panState = null;
  document.addEventListener('wheel', e => {
    if (appState.mission.stage !== 2 || !e.target.closest('#cv')) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    appState.canvasZoom = Math.max(0.45, Math.min(1.5, +(appState.canvasZoom + delta).toFixed(2)));
    refreshBuilderView();
    centerBuilderCanvas();
  }, { passive: false });

  document.addEventListener('pointerdown', e => {
    if (appState.mission.stage !== 2) return;
    const cv = e.target.closest('#cv');
    if (!cv || e.target.closest('.pt[data-u]') || e.target.closest('[data-p]')) return;
    panState = { cv, x: e.clientX, y: e.clientY, sl: cv.scrollLeft, st: cv.scrollTop };
  });

  document.addEventListener('pointermove', e => {
    if (!panState) return;
    panState.cv.scrollLeft = panState.sl - (e.clientX - panState.x);
    panState.cv.scrollTop = panState.st - (e.clientY - panState.y);
  });

  document.addEventListener('pointerup', () => {
    panState = null;
  });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-close-modal]') || e.target.id === 'rev' || e.target.id === 'help') {
      AudioEngine.click();
      closeOpenModals();
      return;
    }

    const prebuiltBtn = e.target.closest('[data-load-prebuilt]');
    if (prebuiltBtn) {
      e.stopPropagation();
      if (!isDeveloperMode()) return showToast('Unlock Developer Mode first to load prebuilt reference rockets.');
      saveUndoSnapshot();
      const loaded = buildDeveloperPrebuilt(prebuiltBtn.dataset.loadPrebuilt);
      if (loaded) {
        appState.selectedPartUid = null;
        saveMissionProgress();
        AudioEngine.attach();
        $('#rev').hidden = true;
        navigateToStage(2);
        autoFitBuilderCanvas();
        showToast(`Loaded 3★ Prebuilt: ${loaded.title}`);
      }
      return;
    }

    const actionEl = e.target.closest('[data-a], [data-st]');
    if (actionEl) {
      AudioEngine.click();
      const { st, a, v } = actionEl.dataset;

      if (st) return navigateToStage(+st);
      if (a === 'ci') {
        if (!isContractOpen(DATA.contracts[+v].id)) return showToast('That destination is locked. Check Career for the requirement.');
        appState.mission.ci = +v;
        appState.mission.oi = 0;
        saveMissionProgress();
        return renderObjectiveStage();
      }
      if (a === 'oi') { appState.mission.oi = +v; saveMissionProgress(); return renderObjectiveStage(); }
      if (a === 'L') { appState.mission.L = v; saveMissionProgress(); return renderObjectiveStage(); }
      if (a === 'hd') { appState.mission.hard = +v; saveMissionProgress(); return renderObjectiveStage(); }
      if (a === 'go2') return navigateToStage(2);
      if (a === 'go1') return navigateToStage(1);
      if (a === 'deb') return navigateToStage(4);
      if (a === 'rot') return rotateSelectedPart(1);
      if (a === 'flp') return flipSelectedPart();
      if (a === 'del') return deleteSelectedPart();
      if (a === 'undo') return undoLastAction();
      if (a === 'zi') {
        appState.canvasZoom = Math.min(1.3, +(appState.canvasZoom + 0.1).toFixed(2));
        refreshBuilderView();
        centerBuilderCanvas();
        return;
      }
      if (a === 'zo') {
        appState.canvasZoom = Math.max(0.45, +(appState.canvasZoom - 0.1).toFixed(2));
        refreshBuilderView();
        centerBuilderCanvas();
        return;
      }
      if (a === 'rev') return showReviewModal();
      return;
    }

    if (e.target.id === 'rgo') {
      $('#rev').hidden = true;
      startLaunchSequence();
    }

    if (e.target.id === 'car') showCareerModal();

    if (e.target.id === 'creset') {
      resetCareer();
      localStorage.removeItem('apogeeMissionState');
      localStorage.removeItem('apogeeSavedBuilds');
      location.reload();
    }

    if (e.target.id === 'confirm-save-build') {
      const inputEl = $('#new-build-name');
      const res = saveNamedBuild(inputEl ? inputEl.value : '');
      if (!res.ok) return showToast(res.message);
      AudioEngine.attach();
      const myBuildsBtn = $('#my-builds');
      if (myBuildsBtn) myBuildsBtn.textContent = `My builds (${appState.savedBuilds.length})`;
      showSavedBuildsModal();
      showToast(`Saved "${res.entry.name}".`);
    }

    const loadBuildBtn = e.target.closest('[data-load-build]');
    const delBuildBtn = e.target.closest('[data-del-build]');
    if (loadBuildBtn) {
      const build = appState.savedBuilds.find(b => b.id === loadBuildBtn.dataset.loadBuild);
      if (build) {
        if (DATA.contracts[build.mission.ci] && !isContractOpen(DATA.contracts[build.mission.ci].id)) {
          return showToast('That saved build targets a destination still locked in Career mode.');
        }
        saveUndoSnapshot();
        appState.mission = { ...appState.mission, ...JSON.parse(JSON.stringify(build.mission)), stage: 2, locked: false };
        appState.selectedPartUid = null;
        saveMissionProgress();
        $('#rev').hidden = true;
        navigateToStage(2);
        showToast(`Loaded "${build.name}".`);
      }
    }
    if (delBuildBtn) {
      deleteSavedBuild(delBuildBtn.dataset.delBuild);
      const myBuildsBtn = $('#my-builds');
      if (myBuildsBtn) myBuildsBtn.textContent = `My builds (${appState.savedBuilds.length})`;
      showSavedBuildsModal();
    }

    const loadCandidateBtn = e.target.closest('[data-c]');
    const deleteCandidateBtn = e.target.closest('[data-x]');
    if (loadCandidateBtn) {
      const candidateData = JSON.parse(appState.candidates[+loadCandidateBtn.dataset.c]);
      saveUndoSnapshot();
      appState.mission = { ...appState.mission, ...candidateData, stage: 2, locked: false };
      appState.selectedPartUid = null;
      saveMissionProgress();
      $('#rev').hidden = true;
      navigateToStage(2);
    }
    if (deleteCandidateBtn) {
      appState.candidates.splice(+deleteCandidateBtn.dataset.x, 1);
      saveMissionProgress();
      appState.candidates.length ? showCompareModal() : ($('#rev').hidden = true);
    }

    if (e.target.id === 'start') {
      $('#title').hidden = true;
      AudioEngine.setMusic('design');
      navigateToStage(1);
    }

    if (e.target.id === 'demo-ok') {
      $('#title').hidden = true;
      appState.mission.locked = false;
      appState.mission.ci = 1;
      appState.mission.oi = 0;
      appState.mission.L = 'medium';
      appState.mission.hard = 0;
      buildStarterSpacecraft();
      autoAttachPart('i_spec');
      autoAttachPart('ant_mg');
      autoAttachPart('rec');
      saveMissionProgress();
      AudioEngine.setMusic('design');
      navigateToStage(2);
      showToast('Loaded a complete Moon spacecraft that meets the science goal. Click "Design review and launch" to fly it.');
    }

    if (e.target.id === 'demo-fail') {
      $('#title').hidden = true;
      appState.mission.locked = false;
      buildFailingDemoSpacecraft();
      saveMissionProgress();
      AudioEngine.setMusic('design');
      navigateToStage(2);
      showToast('Loaded an under-fueled Mars design. Launch it to see why it fails.');
    }

    if (['hp', 'hp2'].includes(e.target.id)) {
      $('#help').hidden = false;
    }

    if (e.target.id === 'copy-code-btn') {
      const textArea = $('#design-code-input');
      textArea.select();
      try {
        navigator.clipboard.writeText(textArea.value);
        showToast('Design code copied to clipboard.');
      } catch {
        showToast('Press Ctrl+C to copy the highlighted design code.');
      }
    }

    if (e.target.id === 'load-code-btn') {
      try {
        const raw = $('#design-code-input').value.trim();
        const decoded = JSON.parse(atob(raw));
        if (DATA.contracts[decoded.ci] && !isContractOpen(DATA.contracts[decoded.ci].id)) {
          return showToast('That design flies to a destination that is still locked in Career mode.');
        }
        const isValid =
          DATA.contracts[decoded.ci] &&
          DATA.launchers[decoded.L] &&
          Array.isArray(decoded.parts) &&
          decoded.parts.every(p => p.id === 'tank' || DATA.parts[p.id] || DATA.engines[p.id]);

        if (isValid) {
          appState.mission = { ...appState.mission, ...decoded, stage: 2, locked: false };
          saveMissionProgress();
          $('#rev').hidden = true;
          navigateToStage(2);
          showToast('Design loaded successfully.');
        } else {
          showToast('Invalid design code structure.');
        }
      } catch {
        showToast('Could not decode design string.');
      }
    }
  });

  $('#mute').addEventListener('click', () => {
    syncAudioControls(AudioEngine.toggleMute());
  });

  $('#vol')?.addEventListener('input', e => {
    syncAudioControls(AudioEngine.setVolume(e.target.value));
  });

  $('#copy').addEventListener('click', () => {
    showDesignCodeModal();
  });
}