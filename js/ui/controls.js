/* File: js/ui/controls.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: NO.
 * Sources used: none
 */
import { DATA } from '../api/mockData.js';
import { isContractOpen, toggleGodMode, resetCareer } from '../core/career.js';
import { ATTACHMENT_NODES, MAX_PARTS, SNAP_RADIUS_PX } from '../config.js';
import {
  appState,
  getNodeCategory,
  saveUndoSnapshot,
  saveMissionProgress,
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
  isStackNode
} from '../core/engine.js';
import { $, showToast } from './domElements.js';
import {
  navigateToStage,
  renderObjectiveStage,
  refreshBuilderView,
  updateBuilderLiveDrag,
  updateCareerButton,
  showReviewModal,
  showCompareModal,
  showDesignCodeModal,
  showCareerModal,
  startLaunchSequence
} from './renderer.js';

function clientToWorldCoords(event) {
  const canvas = $('#cv');
  const rect = canvas.getBoundingClientRect();
  return [
    (canvas.scrollLeft + event.clientX - rect.left) / appState.canvasZoom,
    (canvas.scrollTop + event.clientY - rect.top) / appState.canvasZoom
  ];
}

function rotateSelectedPart(direction) {
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
  const part = appState.selectedPartUid && findPartByUid(appState.selectedPartUid);
  if (!part) return;

  saveUndoSnapshot();
  deletePartSubtree(part.u);
  appState.selectedPartUid = null;
  AudioEngine.remove();
  refreshBuilderView();
}

function undoLastAction() {
  const snapshot = appState.undoHistory.pop();
  if (!snapshot) return showToast('Nothing to undo.');

  [appState.mission.parts, appState.mission.nu] = JSON.parse(snapshot);
  appState.selectedPartUid = null;
  refreshBuilderView();
}

function activateSecretGodMode() {
  const enabled = toggleGodMode();
  updateCareerButton();
  if (appState.mission.stage === 1) renderObjectiveStage();
  showToast(
    enabled
      ? 'Director Override active: all Solar System destinations unlocked.'
      : 'Director Override off: standard Career locks restored.'
  );
}

function closeOpenModals() {
  $('#rev').hidden = true;
  $('#help').hidden = true;
}

export function bindGlobalControls() {
  document.addEventListener('dragstart', e => {
    e.preventDefault();
  });

  let logoClicks = 0;
  let logoClickTimer = null;
  const registerLogoTap = () => {
    logoClicks++;
    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => { logoClicks = 0; }, 2200);
    if (logoClicks >= 5) {
      logoClicks = 0;
      activateSecretGodMode();
    }
  };

  $('#tt')?.addEventListener('click', registerLogoTap);
  $('#brand-home')?.addEventListener('click', e => {
    e.preventDefault();
    registerLogoTap();
  });

  let keyBuffer = '';
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeOpenModals();
      return;
    }
    if (/SELECT|TEXTAREA|INPUT/.test(e.target.tagName)) return;
    if (e.key && e.key.length === 1) {
      keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-6);
      if (keyBuffer === 'apogee') {
        keyBuffer = '';
        activateSecretGodMode();
      }
    }
  });

  document.addEventListener('pointerdown', e => {
    if (appState.mission.stage !== 2) return;

    const placedEl = e.target.closest('.pt[data-u]');
    const paletteEl = e.target.closest('[data-p]');
    if (!placedEl && !paletteEl) return;
    e.preventDefault();

    if (paletteEl) {
      appState.activeDrag = {
        nid: paletteEl.dataset.p,
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        mv: false
      };
      return;
    }

    const part = findPartByUid(+placedEl.dataset.u);
    if (part && appState.selectedPartUid !== part.u) {
      appState.selectedPartUid = part.u;
      AudioEngine.click();
      refreshBuilderView();
    }
  });

  document.addEventListener('pointermove', e => {
    const drag = appState.activeDrag;
    if (!drag || !drag.nid || e.pointerId !== drag.pointerId) return;

    if (!drag.mv) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 10) return;

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
        mv: true,
        orig: { [newPart.u]: [newPart.x, newPart.y] }
      };
      refreshBuilderView();
      AudioEngine.click();
    }

    const activeDrag = appState.activeDrag;
    const worldPos = clientToWorldCoords(e);
    const dx = worldPos[0] - activeDrag.w0[0];
    const dy = worldPos[1] - activeDrag.w0[1];
    const draggedPart = findPartByUid(activeDrag.u);
    if (!draggedPart) return;

    draggedPart.x = activeDrag.orig[draggedPart.u][0] + dx;
    draggedPart.y = activeDrag.orig[draggedPart.u][1] + dy;

    activeDrag.sn = null;
    if (getNodeCategory(draggedPart.id) !== 'bus') {
      const occupied = getOccupiedNodes();
      const draggedTree = new Set(getSubtreeUids(activeDrag.u));
      let closestDist = SNAP_RADIUS_PX;

      const origFlip = draggedPart.flip;
      const origRot = draggedPart.rot;

      ATTACHMENT_NODES[getNodeCategory(draggedPart.id)].forEach(([childNode]) => {
        if (occupied.has(`${draggedPart.u}:${childNode}`)) return;

        appState.mission.parts.forEach(host => {
          if (draggedTree.has(host.u)) return;

          ATTACHMENT_NODES[getNodeCategory(host.id)].forEach(([hostNode]) => {
            if (occupied.has(`${host.u}:${hostNode}`) || isStackNode(childNode) !== isStackNode(hostNode)) return;

            if (!isStackNode(childNode)) {
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
  });

  const finishPointerDrag = e => {
    const drag = appState.activeDrag;
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
    appState.activeDrag = null;

    if (!drag.mv) {
      if (drag.nid) {
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
    // Sticky top-right X button or clicking dark backdrop closes any open modal
    if (e.target.closest('[data-close-modal]') || e.target.id === 'rev' || e.target.id === 'help') {
      AudioEngine.click();
      closeOpenModals();
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
      if (a === 'rot') return rotateSelectedPart(1);
      if (a === 'flp') return flipSelectedPart();
      if (a === 'del') return deleteSelectedPart();
      if (a === 'undo') return undoLastAction();
      if (a === 'zi') { appState.canvasZoom = Math.min(1.3, appState.canvasZoom + 0.1); return refreshBuilderView(); }
      if (a === 'zo') { appState.canvasZoom = Math.max(0.35, appState.canvasZoom - 0.1); return refreshBuilderView(); }
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
      location.reload();
    }

    const loadCandidateBtn = e.target.closest('[data-c]');
    const deleteCandidateBtn = e.target.closest('[data-x]');
    if (loadCandidateBtn) {
      const candidateData = JSON.parse(appState.candidates[+loadCandidateBtn.dataset.c]);
      saveUndoSnapshot();
      appState.mission = { ...appState.mission, ...candidateData, stage: 2 };
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
      navigateToStage(appState.mission.stage || 1);
    }

    if (e.target.id === 'demo-ok') {
      $('#title').hidden = true;
      buildStarterSpacecraft();
      autoAttachPart('ant_lg');
      saveMissionProgress();
      AudioEngine.setMusic('design');
      navigateToStage(2);
      showToast('Loaded complete starter spacecraft. Click "Design review and launch" to simulate.');
    }

    if (e.target.id === 'demo-fail') {
      $('#title').hidden = true;
      buildFailingDemoSpacecraft();
      saveMissionProgress();
      AudioEngine.setMusic('design');
      navigateToStage(2);
      showToast('Loaded overweight/under-fueled Mars design to inspect failure diagnostics.');
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
          appState.mission = { ...appState.mission, ...decoded, stage: 2 };
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

  $('#mute').addEventListener('click', e => {
    const isNowOn = AudioEngine.toggleMute();
    e.target.textContent = `Sound: ${isNowOn ? 'on' : 'off'}`;
    e.target.classList.toggle('sound-on', isNowOn);
  });

  $('#copy').addEventListener('click', () => {
    showDesignCodeModal();
  });
}