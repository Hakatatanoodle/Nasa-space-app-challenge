/* File: js/ui/renderer.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-14; Claude, 2026-11-14. Reviewed by a human: NO.
 * Sources used: NASA_CUBESAT101, JPL_CML
 */
import { DATA } from '../api/mockData.js';
import { CONTENT } from '../content.js';
import { ATTACHMENT_NODES, MAX_CANDIDATES } from '../config.js';
import {
  appState,
  getNodeCategory,
  getAssetFilename,
  getLockClass,
  saveUndoSnapshot,
  AudioEngine
} from '../core/state.js';
import {
  fillTemplate,
  findPartByUid,
  getPartSize,
  getNodeWorldPosition,
  getSubtreeUids,
  getOccupiedNodes,
  getConnectedPartUids,
  calculateTelemetry,
  resolveFlight,
  buildStarterSpacecraft
} from '../core/engine.js';
import { $, $$, toPercent, formatNumber, delay, showToast } from './domElements.js';

const renderDataBadge = isVerified =>
  isVerified
    ? '<span class="badge-source">verified source</span>'
    : '<span class="badge-simplified">simplified</span>';

/* ---- Stage Navigation ---- */

export function navigateToStage(stageNumber) {
  if (appState.isFlying) return;
  appState.mission.stage = stageNumber;

  $$('.st').forEach((section, index) => {
    section.classList.toggle('on', index + 1 === stageNumber);
  });

  $('#nav').innerHTML = CONTENT.stageNames.map((label, index) => {
    const num = index + 1;
    const isActive = num === stageNumber;
    const isCompleted = num < stageNumber;
    const isDisabled = num === 3 || (num === 4 && !appState.mission.res);
    return `<button type="button" data-st="${num}" class="${isActive ? 'on' : isCompleted ? 'done' : ''}" ${isDisabled ? 'disabled' : ''}>${label}</button>`;
  }).join('');

  if (stageNumber === 1) renderObjectiveStage();
  if (stageNumber === 2) renderBuilderStage();
  if (stageNumber === 4) renderDebriefStage();

  $('#pass').hidden = !appState.isTeamMode;
  $('#pass').textContent = `Role: ${appState.activeRole} — pass keyboard`;
}

/* ---- Stage 1: Objective Selection ---- */

const formatOrbitSummary = orbit =>
  `${toPercent(orbit.ecl)}% shadow · ${(orbit.contact * 24).toFixed(0)} h/day contact · detail x${orbit.res} · needs ${orbit.dv} km/s`;

export function renderObjectiveStage() {
  const mission = appState.mission;
  const contract = DATA.contracts[mission.ci];

  const contractCards = DATA.contracts.map((c, index) => `
    <div class="card ${index === mission.ci ? 'sel' : ''}" role="button" tabindex="0" data-a="ci" data-v="${index}">
      <img src="assets/dest_${c.dest}.svg" alt="${c.n}">
      <div>
        <b>${c.n}</b> ${renderDataBadge(c.verified)}
        <p>${CONTENT.contractBriefs[c.id]}</p>
        <small>Baseline science ${c.target} (threshold ${c.thr}) · budget $${c.cap}M · ${c.months} months${appState.highScores[c.id] ? ' · best ' + appState.highScores[c.id] : ''}</small>
      </div>
    </div>
  `).join('');

  const orbitCards = contract.orbits.map((o, index) => `
    <div class="card o ${index === mission.oi ? 'sel' : ''}" role="button" tabindex="0" data-a="oi" data-v="${index}">
      <div>
        <b>${o.n}</b> — ${CONTENT.orbitDescriptions[o.n]} ${renderDataBadge(o.verified)}<br>
        <small>${formatOrbitSummary(o)}</small>
      </div>
    </div>
  `).join('');

  const launcherCards = Object.keys(DATA.launchers).map(key => {
    const l = DATA.launchers[key];
    return `
      <div class="card ${mission.L === key ? 'sel' : ''}" role="button" tabindex="0" data-a="L" data-v="${key}">
        <img src="assets/${l.img}.svg" alt="${l.n}">
        <div>
          <b>${l.n}</b> ${renderDataBadge(l.verified)}
          <p>Lifts ${formatNumber(l.cap)} kg</p>
          <small>$${l.c}M · ${toPercent(l.rel)}% reliable</small>
        </div>
      </div>
    `;
  }).join('');

  $('#s1').innerHTML = `
    <div class="${getLockClass('plan')}">
      <h2>1. Choose your mission objective <small style="font-size:0.85rem;font-weight:400;">(${appState.dataSourceLabel})</small></h2>
      <div class="row">${contractCards}</div>
      <h3>Orbit: where will it work?</h3>
      <div class="row">${orbitCards}</div>
      <h3>Launcher: how will it get up there?</h3>
      <div class="row">${launcherCards}</div>
    </div>
    <h3>Science objectives for ${contract.n}</h3>
    <p><small>Baseline = full goal (${contract.target} points). Threshold = minimum worth flying (${contract.thr}).</small></p>
    <ul>${contract.obj.map(o => `<li>${o.n}: served by ${o.ins.map(id => DATA.parts[id].n).join(' or ')}</li>`).join('')}</ul>
    <h3>Margin policy: how much reserve must you keep?</h3>
    <p><small title="${CONTENT.marginFormulaTooltip}">${CONTENT.marginFormulaTooltip}</small></p>
    <div class="row">
      <div class="card o ${mission.hard ? '' : 'sel'}" role="button" tabindex="0" data-a="hd" data-v="0">
        <div><b>Rookie: 10% reserve</b> ${renderDataBadge(DATA.marginPolicies.easy.verified)} — ${DATA.marginPolicies.easy.src}</div>
      </div>
      <div class="card o ${mission.hard ? 'sel' : ''}" role="button" tabindex="0" data-a="hd" data-v="1">
        <div><b>NASA CML 4: 35% reserve</b> ${renderDataBadge(DATA.marginPolicies.hard.verified)} — ${DATA.marginPolicies.hard.src}</div>
      </div>
    </div>
    <button type="button" class="go" data-a="go2">Design the spacecraft &rarr;</button>
  `;
}

/* ---- Stage 2: Spacecraft Builder ---- */

function formatPartSpecs(partId) {
  if (partId === 'tank') return `${DATA.tank.dry} kg + ${DATA.tank.prop} kg fuel · $${DATA.tank.c}M`;
  if (DATA.engines[partId]) return `${DATA.engines[partId].m} kg · Isp ${DATA.engines[partId].isp} s · $${DATA.engines[partId].c}M`;

  const p = DATA.parts[partId];
  return [
    `${p.m} kg · $${p.c}M`,
    p.gen ? `makes ${p.gen} W` : '',
    p.wh ? `${p.wh} Wh` : '',
    p.mb ? `${p.mb} Mbps` : '',
    p.gb ? `stores ${p.gb} Gb` : '',
    p.data ? `${p.data} Gb/day` : '',
    p.sci ? `science ${p.sci}` : '',
    p.pw > 0 ? `uses ${p.pw} W` : ''
  ].filter(Boolean).join(' · ');
}

function getPartDisplayName(partId) {
  if (partId === 'tank') return 'Fuel tank';
  if (DATA.engines[partId]) return `${DATA.engines[partId].n} engine`;
  return DATA.parts[partId].n;
}

function renderPaletteTile(partId) {
  return `
    <button type="button" class="tile" data-p="${partId}">
      <img src="assets/${getAssetFilename(partId)}.svg" alt="">
      <div>
        <b>${getPartDisplayName(partId)}</b>
        <small>${formatPartSpecs(partId)}</small>
      </div>
    </button>
  `;
}

const getPartsByGroup = group => Object.keys(DATA.parts).filter(id => DATA.parts[id].g === group);

export function renderBuilderStage() {
  const renderSection = (group, title, ids) => `
    <div class="${getLockClass(group)}">
      <h3>${title}</h3>
      ${ids.map(renderPaletteTile).join('')}
    </div>
  `;

  const paletteHtml =
    renderSection('stk', 'Structure', [...getPartsByGroup('bus'), 'tank', ...Object.keys(DATA.engines)]) +
    renderSection('pow', 'Power', getPartsByGroup('pow')) +
    renderSection('com', 'Communications', getPartsByGroup('com')) +
    renderSection('sci', 'Science instruments', getPartsByGroup('sci'));

  const launcherOptions = Object.keys(DATA.launchers)
    .map(k => `<option value="${k}">${DATA.launchers[k].n}</option>`)
    .join('');

  $('#s2').innerHTML = `
    <div id="b3">
      <div id="pal" aria-label="Spacecraft parts palette">${paletteHtml}</div>
      <div>
        <div class="row" style="align-items: center;">
          <b id="mn"></b>
          <span style="flex: 1;"></span>
          <select id="sl" aria-label="Select launcher">${launcherOptions}</select>
          <select id="so" aria-label="Select orbit"></select>
        </div>
        <div class="row" style="margin: 6px 0; align-items: center;">
          <label class="team-toggle" for="mir">
            <input type="checkbox" id="mir" ${appState.mission.mirror ? 'checked' : ''}> Mirror symmetry
          </label>
          <button type="button" data-a="undo">Undo</button>
          <button type="button" id="stk">Starter ship</button>
          <button type="button" id="clr">Clear</button>
          <button type="button" id="cand">Save candidate</button>
          <button type="button" id="cmp">Compare</button>
          <span style="flex: 1;"></span>
          <button type="button" data-a="zo" aria-label="Zoom out">-</button>
          <button type="button" data-a="zi" aria-label="Zoom in">+</button>
        </div>
        <div id="cv"><div id="wr"><div id="world"></div></div></div>
        <div id="insp" aria-live="polite"></div>
      </div>
      <div id="mt" aria-live="polite"></div>
    </div>
  `;

  $('#sl').onchange = e => { appState.mission.L = e.target.value; refreshBuilderView(); };
  $('#so').onchange = e => { appState.mission.oi = +e.target.value; refreshBuilderView(); };
  $('#mir').onchange = e => { appState.mission.mirror = e.target.checked; };

  $('#clr').onclick = () => {
    saveUndoSnapshot();
    appState.mission.parts = [];
    appState.selectedPartUid = null;
    refreshBuilderView();
  };

  $('#cand').onclick = () => {
    if (appState.candidates.length >= MAX_CANDIDATES) {
      return showToast('Three candidates max. Open Compare to load or delete one.');
    }
    const { parts, nu, L, oi, ci, hard, seed } = appState.mission;
    appState.candidates.push(JSON.stringify({ parts, nu, L, oi, ci, hard, seed }));
    showToast(`Saved as candidate ${'ABC'[appState.candidates.length - 1]}`);
  };

  $('#cmp').onclick = showCompareModal;
  $('#stk').onclick = () => {
    saveUndoSnapshot();
    buildStarterSpacecraft();
    appState.selectedPartUid = null;
    refreshBuilderView();
  };

  autoFitBuilderCanvas();
}

function renderSpacecraftCanvas(telemetry) {
  const connected = getConnectedPartUids();
  const occupied = getOccupiedNodes();
  const drag = appState.activeDrag;
  const isDragging = drag && drag.mv;

  let html = appState.mission.parts.map(part => {
    const [w, h] = getPartSize(part);
    const selectedClass = part.u === appState.selectedPartUid ? ' sel' : '';
    const floatingClass = connected.has(part.u) ? '' : ' float';
    return `
      <img class="pt${selectedClass}${floatingClass}"
           tabindex="0"
           role="button"
           aria-label="${getPartDisplayName(part.id)}"
           data-u="${part.u}"
           src="assets/${getAssetFilename(part.id)}.svg"
           style="left:${part.x - w / 2}px; top:${part.y - h / 2}px; width:${w}px; height:${h}px; transform:rotate(${part.rot}deg) scaleX(${part.flip ? -1 : 1});"
           draggable="false">
    `;
  }).join('');

  const draggedSubtree = isDragging ? new Set(getSubtreeUids(drag.u)) : new Set();
  appState.mission.parts.forEach(part => {
    ATTACHMENT_NODES[getNodeCategory(part.id)].forEach(([nodeName]) => {
      if (occupied.has(`${part.u}:${nodeName}`)) return;
      const [x, y] = getNodeWorldPosition(part, nodeName);
      const nodeCls = isDragging ? (draggedSubtree.has(part.u) ? 'own' : '') : 'idle';
      html += `<i class="nd ${nodeCls}" style="left:${x}px; top:${y}px;"></i>`;
    });
  });

  if (isDragging && drag.sn) {
    const [snapX, snapY] = getNodeWorldPosition(findPartByUid(drag.sn.h), drag.sn.hn);
    html += `<i class="nd hot" style="left:${snapX}px; top:${snapY}px;"></i>`;
  }

  if (connected.size > 0) {
    html += `
      <i class="com" title="Center of mass" style="left:${telemetry.comx}px; top:${telemetry.comy}px;"></i>
      <u class="thr" title="Engine thrust line" style="left:${telemetry.engx}px; top:${telemetry.box[0]}px; height:${telemetry.box[1] - telemetry.box[0]}px;"></u>
    `;
  }

  return html;
}





function autoFitBuilderCanvas() {
  const cv = $('#cv');
  if (!cv) return;
  const idealZoom = Math.max(0.75, Math.min(1.05, +(cv.clientWidth / 920).toFixed(2)));
  appState.canvasZoom = idealZoom;
  refreshBuilderView();
  cv.scrollLeft = Math.max(0, (960 * idealZoom - cv.clientWidth) / 2);
  cv.scrollTop = 40;
}

export function refreshBuilderView() {
  const mission = appState.mission;
  const telemetry = (mission.d = calculateTelemetry());
  const contract = telemetry.C;

  const errorCount =
    telemetry.rows.filter(r => r.mg < 0).length +
    telemetry.checks.filter(c => c.st === 0).length;

  if (errorCount > appState.previousErrorCount) AudioEngine.warn();
  appState.previousErrorCount = errorCount;

  $('#mn').textContent = contract.n;
  $('#sl').value = mission.L;
  $('#so').innerHTML = contract.orbits.map((o, i) => `<option value="${i}">${o.n}</option>`).join('');
  $('#so').value = mission.oi;

  $('#wr').style.width = `${960 * appState.canvasZoom}px`;
  $('#wr').style.height = `${1100 * appState.canvasZoom}px`;
  $('#world').style.transform = `scale(${appState.canvasZoom})`;
  $('#world').innerHTML = renderSpacecraftCanvas(telemetry);

  const selectedPart = appState.selectedPartUid && findPartByUid(appState.selectedPartUid);
  $('#insp').innerHTML = selectedPart
    ? `<b>${getPartDisplayName(selectedPart.id)}</b> <small>${formatPartSpecs(selectedPart.id)}</small> <button type="button" data-a="rot">Rotate (R)</button><button type="button" data-a="flp">Flip (F)</button><button type="button" data-a="del">Delete</button>`
    : '<small>Drag parts onto glowing dots, or click/Enter a part to auto-attach. Click a placed part to rotate, flip, or delete.</small>';

  const getStatusClass = row => (row.mg < 0 ? 'bad' : row.mg < appState.marginThreshold ? 'w' : 'ok');
  let resourceIndex = 0;

  const resourceBarsHtml = telemetry.rows.map(r => {
    const isSub = CONTENT.subResources.includes(r.n);
    if (!isSub) resourceIndex++;
    const status = getStatusClass(r);
    const fillPct = r.cap > 0 ? Math.min(100, (r.use / r.cap) * 100) : 100;
    const statusLabel = r.mg < 0 ? 'FAIL' : r.mg < appState.marginThreshold ? 'THIN' : 'OK';

    return `
      <div class="m ${isSub ? 'sub' : ''}">
        <span>${isSub ? '' : `<b>${resourceIndex}</b> `}${r.n}</span>
        <i class="${status}"><u style="width:${fillPct}%"></u></i>
        <b class="${status}">${statusLabel}</b>
        <em>${formatNumber(r.use)} needed / ${formatNumber(r.cap)} ${r.u} ${r.verified ? '' : '<span class="badge-simplified">simplified</span>'}</em>
        ${r.mg < appState.marginThreshold ? `<p class="why">${r.why} <b>Fix:</b> ${r.fix}</p>` : ''}
      </div>
    `;
  }).join('');

  const checksHtml = telemetry.checks.map(c => `
    <div class="chk ${['bad', 'w', 'ok'][c.st]}">
      ${['✗', '!', '✓'][c.st]} ${c.t}
      ${c.st < 2 ? `<p class="why">${c.why} <b>Fix:</b> ${c.fix}</p>` : ''}
    </div>
  `).join('');

  const signOffChips = Object.keys(telemetry.sign).map(role => `
    <span class="chip ${telemetry.sign[role] ? 'ok' : ''} ${appState.isTeamMode && role === appState.activeRole ? 'me' : ''}">
      ${telemetry.sign[role] ? '✓ Signed' : '○ Pending'}: ${role}
    </span>
  `).join('');

  $('#mt').innerHTML = `
    <b>Mission resources</b>
    ${resourceBarsHtml}
    <p><b>Assembly checks</b></p>
    ${checksHtml}
    <p>Predicted science <b>${telemetry.sciF.toFixed(0)}</b> / ${contract.target} pts. Transit ${formatNumber(telemetry.days)} days. Useful life ${Math.max(0, telemetry.life).toFixed(0)} months. Launch reliability <b>${toPercent(telemetry.reliability)}%</b> (multiplies your final score).</p>
    <div class="row">${signOffChips}</div>
    <button type="button" class="go" id="gol" data-a="rev" style="width:100%"></button>
    <button type="button" data-a="go1" style="width:100%; margin-top:8px">&larr; Back to objective</button>
  `;

  const isOverweight = telemetry.g('Mass').mg < 0;
  const isOverBudget = telemetry.g('Budget').mg < 0;
  $('#gol').disabled = !!telemetry.bad || isOverweight || isOverBudget;
  $('#gol').textContent = telemetry.bad
    ? telemetry.bad.t
    : isOverweight
      ? 'Too heavy for this launcher'
      : isOverBudget
        ? 'Over budget'
        : 'Design review and launch';
}

/* ---- Modals: Design Review, Trade Space, Share/Load Code ---- */

/** Predicted flight: the same deterministic result the launch will play out. No dice. */
const renderPredictedFlight = telemetry => {
  const flight = resolveFlight(telemetry);
  const text = CONTENT.predictedFlight;
  const contract = telemetry.C;
  const isFatal = flight.steps.some(step => step.fatal);

  const eventItems = isFatal
    ? `<li>${flight.reasons[0]}</li>`
    : flight.events.length
      ? flight.events.map(event => `<li>${CONTENT.eventText[event.id].n}: ${event.immune ? text.eventImmune : fillTemplate(text.eventHit, { lossPct: 1 - event.scienceFactor })}</li>`).join('')
      : `<li>${text.noEvents}</li>`;

  return `
    <h3>${text.heading}</h3>
    <p><small>${text.note}</small></p>
    <p><b>${CONTENT.outcomeLabels[flight.outcome]}</b>: science ${flight.science.toFixed(0)} (threshold ${contract.thr}, baseline ${contract.target}), launch reliability ${toPercent(flight.reliability)}%, ${flight.stars}&#9733;, ${flight.score} pts.</p>
    <ul>${eventItems}</ul>
  `;
};

export function showReviewModal() {
  const telemetry = appState.mission.d;
  const rev = telemetry.rev;
  const colors = ['r', 'y', 'g'];

  $('#rev').innerHTML = `
    <div class="box modal-box">
      <h2>Design review</h2>
      <p>${appState.mission.hard ? 'NASA CML 4 policy: 35% reserve.' : 'Rookie policy: 10% reserve.'} A concept passes readiness review when at least ${toPercent(DATA.reviewThreshold.v)}% of items are green (${DATA.reviewThreshold.src}).</p>
      <p><b class="${rev.pass ? 'g' : 'r'}">${rev.pass ? '✓ REVIEW PASSED' : '✗ NOT READY'}</b> — ${rev.g} green, ${rev.y} amber, ${rev.r} red of ${rev.n} items (${toPercent(rev.pct)}%)</p>
      <div class="row">
        ${telemetry.revItems.map(([label, code]) => `<span class="chip ${code === 2 ? 'ok' : ''}"><span class="${colors[code]}">&#9679;</span> ${label}</span>`).join('')}
      </div>
      ${renderPredictedFlight(telemetry)}
      <div class="row" style="margin-top:14px">
        <button type="button" class="go" id="rgo" style="margin:0">Launch now</button>
        <button type="button" id="rback">Back to design</button>
      </div>
    </div>
  `;
  $('#rev').hidden = false;
}

function evaluateCandidate(serializedJson) {
  const currentSnapshot = appState.mission;
  appState.mission = { ...currentSnapshot, ...JSON.parse(serializedJson), stage: 2 };
  const d = calculateTelemetry();
  const flight = resolveFlight(d);
  appState.mission = currentSnapshot;
  calculateTelemetry();
  return { d, flight };
}

export function showCompareModal() {
  if (!appState.candidates.length) {
    return showToast('Save at least one design first (Save candidate).');
  }

  const evaluations = appState.candidates.map(evaluateCandidate);
  const metrics = [
    ['Mission and orbit', x => `${x.d.C.n}, ${x.d.O.n}`],
    ['Launcher', x => x.d.L.n],
    ['Launch mass', x => `${formatNumber(x.d.m0)} / ${formatNumber(x.d.L.cap)} kg`],
    ['Cost', x => `$${x.d.cost}M of $${x.d.C.cap}M`],
    ['Predicted science', x => `${x.d.sciF.toFixed(0)} pts (threshold ${x.d.C.thr}, baseline ${x.d.C.target})`],
    ['Design review', x => `${toPercent(x.d.rev.pct)}% green: ${x.d.rev.pass ? 'pass' : 'not ready'}`],
    ['Launch reliability', x => `${toPercent(x.d.reliability)}% (multiplies score)`],
    ['Predicted flight', x => `${CONTENT.outcomeLabels[x.flight.outcome]}: ${x.flight.stars}\u2605, ${x.flight.score} pts`]
  ];

  $('#rev').innerHTML = `
    <div class="box modal-box" style="width: min(980px, 96vw);">
      <h2>Trade space: compare candidates</h2>
      <p><small>Compare cost, science, and risk side by side, then load a candidate to refine.</small></p>
      <table class="rt">
        <tr><th>Metric</th>${evaluations.map((_, i) => `<th>Candidate ${'ABC'[i]}</th>`).join('')}</tr>
        ${metrics.map(([title, formatter]) => `<tr><th>${title}</th>${evaluations.map(ev => `<td>${formatter(ev)}</td>`).join('')}</tr>`).join('')}
        <tr><th>Actions</th>${evaluations.map((_, i) => `<td><button type="button" data-c="${i}">Load</button> <button type="button" data-x="${i}">Delete</button></td>`).join('')}</tr>
      </table>
      <button type="button" id="rback">Close</button>
    </div>
  `;
  $('#rev').hidden = false;
}

export function showDesignCodeModal() {
  const { d, res, stage, ...serializableState } = appState.mission;
  const encoded = btoa(JSON.stringify(serializableState));

  $('#rev').innerHTML = `
    <div class="box modal-box">
      <h2>Share or Load Design Code</h2>
      <p><label for="design-code-input">Copy your current spacecraft code or paste a teammate's code below:</label></p>
      <textarea id="design-code-input" class="code-box">${encoded}</textarea>
      <div class="row">
        <button type="button" id="copy-code-btn">Copy to clipboard</button>
        <button type="button" id="load-code-btn">Load pasted code</button>
        <button type="button" id="rback">Close</button>
      </div>
    </div>
  `;
  $('#rev').hidden = false;
}

/* ---- Stage 3: Deterministic Launch Sequence ---- */

function renderFlightSpacecraft() {
  const connected = getConnectedPartUids();
  const parts = appState.mission.parts.filter(p => connected.has(p.u));
  if (!parts.length) return '';

  const bounds = parts.map(p => {
    const [w, h] = getPartSize(p);
    const [rw, rh] = p.rot % 180 ? [h, w] : [w, h];
    return [p.x - rw / 2, p.y - rh / 2, p.x + rw / 2, p.y + rh / 2];
  });

  const minX = Math.min(...bounds.map(b => b[0]));
  const minY = Math.min(...bounds.map(b => b[1]));
  const maxX = Math.max(...bounds.map(b => b[2]));
  const maxY = Math.max(...bounds.map(b => b[3]));

  const scale = Math.min(1.2, 480 / (maxX - minX), 420 / (maxY - minY));
  const offsetX = 260 - ((minX + maxX) / 2) * scale;
  const offsetY = 40 - minY * scale;

  const hullHtml = parts.map(p => {
    const [w, h] = getPartSize(p);
    return `<img class="pt" src="assets/${getAssetFilename(p.id)}.svg" alt="" style="left:${p.x * scale + offsetX - (w * scale) / 2}px; top:${p.y * scale + offsetY - (h * scale) / 2}px; width:${w * scale}px; height:${h * scale}px; transform:rotate(${p.rot}deg) scaleX(${p.flip ? -1 : 1});" draggable="false">`;
  }).join('');

  const plumeHtml = parts.filter(p => getNodeCategory(p.id) === 'eng').map(p => {
    const [, h] = getPartSize(p);
    return `<img class="pt plume" src="assets/${DATA.engines[p.id].pl}.svg" alt="" style="left:${p.x * scale + offsetX - 40 * scale}px; top:${p.y * scale + offsetY + (h * scale) / 2 - 14 * scale}px; width:${80 * scale}px; z-index:-1;" draggable="false">`;
  }).join('');

  return hullHtml + plumeHtml;
}

/** Turns one engine flight step into a log line. The engine decides; this only describes. */
function describeFlightStep(step) {
  if (step.key === 'event') {
    const text = CONTENT.eventText[step.values.eventId];
    return `<b>Event: ${text.n}.</b> ${text.txt} ${step.ok ? text.immT : text.hitT}`;
  }
  return fillTemplate(CONTENT.flightLog[step.key], step.values);
}

const getFlightStepClass = step => (!step.ok ? 'bad' : ['ascent', 'arrival', 'event'].includes(step.key) ? 'ok' : '');

export async function startLaunchSequence() {
  const mission = appState.mission;
  const telemetry = mission.d;
  const flight = resolveFlight(telemetry);
  mission.res = null;

  navigateToStage(3);
  appState.isFlying = true;

  $('#s3').innerHTML = `
    <div class="fl3">
      <div id="flv"><div class="flc" id="fl">${renderFlightSpacecraft()}</div></div>
      <div class="box" aria-live="polite">
        <h2>3. Launch and operate</h2>
        <div id="log"></div>
        <button type="button" class="go" id="fnext" hidden data-a="deb">See debrief &rarr;</button>
      </div>
    </div>
  `;
  $('#nav').querySelectorAll('button').forEach(btn => { btn.disabled = true; });

  const logEl = $('#log');
  const craftEl = $('#fl');

  const logMessage = async (html, statusClass = '') => {
    AudioEngine.tick();
    logEl.innerHTML += `<p class="${statusClass}">${html}</p>`;
    await delay(900);
  };

  void craftEl.offsetWidth;
  craftEl.classList.add('fly');
  AudioEngine.launch();

  for (const step of flight.steps) {
    if (step.key === 'arrival') {
      craftEl.style.transition = 'none';
      craftEl.classList.remove('fly');
      void craftEl.offsetWidth;
      craftEl.style.transition = '';
      craftEl.classList.add('orbit');
    }
    if (step.fatal) {
      craftEl.classList.add('boom');
      AudioEngine.fail();
    }
    await logMessage(describeFlightStep(step), getFlightStepClass(step));
  }

  concludeMission(flight);
}

/** Stores the engine's result, plays the end sound and unlocks the debrief. */
function concludeMission(flight) {
  const mission = appState.mission;
  const contract = mission.d.C;

  if (flight.outcome === 'success') AudioEngine.win();
  else if (flight.outcome === 'partial') AudioEngine.partial();

  appState.highScores[contract.id] = Math.max(appState.highScores[contract.id] || 0, flight.score);
  try {
    localStorage.tm = JSON.stringify(appState.highScores);
  } catch {}

  mission.res = {
    out: flight.outcome,
    why: flight.reasons,
    sci: flight.science,
    st: flight.stars,
    score: flight.score,
    rel: flight.reliability
  };
  appState.isFlying = false;

  $('#fnext').hidden = false;
  $('#fnext').onclick = () => navigateToStage(4);
  $('#nav').querySelectorAll('button').forEach(btn => {
    btn.disabled = btn.dataset.st === '3';
  });
}

/* ---- Stage 4: Post-Mission Report ---- */

function renderCustomEmblemSvg(outcome, stars) {
  const stroke = outcome === 'lost' ? '#ff856d' : stars >= 2 ? '#7fe3b8' : '#ffc857';
  return `
    <svg class="mission-badge" viewBox="0 0 120 120" role="img" aria-label="Mission outcome emblem">
      <circle cx="60" cy="60" r="54" fill="#0b2038" stroke="${stroke}" stroke-width="4" />
      <ellipse cx="60" cy="60" rx="44" ry="18" transform="rotate(-25 60 60)" fill="none" stroke="#ffc857" stroke-width="2" />
      <circle cx="60" cy="60" r="14" fill="${stroke}" />
      <text x="60" y="102" text-anchor="middle" fill="#f0f6fc" font-size="11" font-family="sans-serif">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</text>
    </svg>
  `;
}

export function renderDebriefStage() {
  const mission = appState.mission;
  const telemetry = mission.d;
  const contract = telemetry.C;
  const { out, why, sci, st, score } = mission.res;

  const installedIds = new Set(
    mission.parts.filter(p => getConnectedPartUids().has(p.u)).map(p => p.id)
  );

  const resourceMarginsTable = `
    <p><b>Six-resource margin summary</b></p>
    <table class="rt">
      <tr><th>Resource</th><th>Used</th><th>Limit</th><th>Margin</th><th>Source</th></tr>
      ${telemetry.rows.map(r => `
        <tr>
          <td>${r.n}</td>
          <td>${formatNumber(r.use)} ${r.u}</td>
          <td>${formatNumber(r.cap)} ${r.u}</td>
          <td class="${r.mg < 0 ? 'r' : r.mg < appState.marginThreshold ? 'y' : 'g'}">${toPercent(r.mg)}%</td>
          <td><small>${r.src}</small></td>
        </tr>
      `).join('')}
    </table>
  `;

  const traceabilityTable = `
    <p><b>Science traceability matrix</b></p>
    <table class="rt">
      <tr><th>Objective</th><th>Instrument on board</th></tr>
      ${contract.obj.map(obj => {
        const matching = obj.ins.filter(id => installedIds.has(id));
        return `<tr><td>${obj.n}</td><td class="${matching.length ? 'g' : 'r'}">${matching.length ? matching.map(id => DATA.parts[id].n).join(', ') : 'Not covered'}</td></tr>`;
      }).join('')}
    </table>
  `;

  const installedArray = [...installedIds];
  const similarityScore = realMission =>
    realMission.ins.filter(id => installedArray.includes(id)).length * 2 + (realMission.oi === mission.oi ? 1 : 0);

  const comparableMissions = DATA.realMissions
    .filter(m => m.dest === contract.dest)
    .sort((a, b) => similarityScore(b) - similarityScore(a))
    .slice(0, 2);

  const heritageList = `
    <p><b>Comparable historical missions</b> ${renderDataBadge(false)}</p>
    <ul>${comparableMissions.map(m => `<li><b>${m.n}</b> (${m.yr}): ${CONTENT.realMissionText[m.n]}</li>`).join('')}</ul>
  `;

  const missingSignOffs = Object.keys(telemetry.sign).filter(role => !telemetry.sign[role]).join(', ') || 'all signed';

  $('#s4').innerHTML = `
    <div class="box">
      ${renderCustomEmblemSvg(out, st)}
      <h2>4. Post-Mission Report — ${'★'.repeat(st) + '☆'.repeat(3 - st)} (${score} pts)</h2>
      <p><b>Outcome:</b> ${CONTENT.outcomeLabels[out]}.</p>
      <p><b>Why it went this way &amp; what to change next</b></p>
      <ul>${(why.length ? why : ['All six resource budgets maintained healthy engineering margins.']).map(reason => `<li>${reason}</li>`).join('')}</ul>
      <p><b>Star criteria:</b> 2&#9733; requires ${contract.target} science pts (achieved ${sci.toFixed(0)}). 3&#9733; also requires all four role sign-offs (${missingSignOffs}) and total cost under $${Math.round(contract.cap * DATA.scoringWeights.threeStarBudgetFraction)}M (spent $${telemetry.cost}M).</p>
      ${resourceMarginsTable}
      ${traceabilityTable}
      ${heritageList}
      <div class="row" style="margin-top:12px;">
        <button type="button" data-a="go2">Edit and re-simulate</button>
        <button type="button" data-a="go1">New mission</button>
      </div>
    </div>
  `;
}