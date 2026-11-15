/* File: js/ui/renderer.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-14; Claude, 2026-11-14; Claude, 2026-11-15 (two manual burns). Reviewed by a human: NO.
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
  scoreBurn,
  createSeededRng,
  buildStarterSpacecraft
} from '../core/engine.js';
import { getFeasibility, buildPlanetBriefing } from '../core/planets.js';
import {
  ACHIEVEMENTS,
  GATES,
  getCareer,
  isContractOpen,
  getContractSortKey,
  getLockInfo,
  getPlanetName,
  getCareerLevel,
  getCareerRank,
  getCareerButtonLabel,
  getNextGate,
  describeGateNeed,
  recordMission
} from '../core/career.js';
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
  updateCareerButton();
}

export function updateCareerButton() {
  $('#car').textContent = getCareerButtonLabel();
}

/* ---- Stage 1: Objective Selection ---- */

const formatOrbitSummary = orbit =>
  `${toPercent(orbit.ecl)}% shadow · ${(orbit.contact * 24).toFixed(0)} h/day contact · detail x${orbit.res} · needs ${orbit.dv} km/s`;

export function renderObjectiveStage() {
  const mission = appState.mission;
  const contract = DATA.contracts[mission.ci];

  // Career mode: unlocked planets sit in solar-system order, locked ones wait at the end (still listed, not selectable).
  const contractCards = DATA.contracts
    .map((c, index) => [c, index])
    .sort((a, b) => getContractSortKey(a[0]) - getContractSortKey(b[0]))
    .map(([c, index]) => {
      const open = isContractOpen(c.id);
      const feasibility = getFeasibility(c);
      const lock = open ? null : getLockInfo(c);
      return `
    <div class="card ${index === mission.ci ? 'sel' : ''} ${open ? '' : 'lkd'}" role="button" ${open ? `tabindex="0" data-a="ci" data-v="${index}"` : 'aria-disabled="true"'}>
      <img src="assets/dest_${c.dest}.svg" alt="${c.n}">
      <div>
        <b>${c.n}</b> ${renderDataBadge(c.verified)}
        <p>${CONTENT.contractBriefs[c.id]}</p>
        <small>Baseline science ${c.target} (threshold ${c.thr}) · budget $${c.cap}M · ${c.months} months${appState.highScores[c.id] ? ' · best ' + appState.highScores[c.id] : ''}</small>
        <span class="fb ${feasibility.cls}">${feasibility.lab}</span><small class="fn">${feasibility.notes.join(' · ')}</small>
        ${lock ? `<span class="lk">LOCKED - Level ${lock.level}: ${lock.need}</span>` : ''}
      </div>
    </div>
  `;
    }).join('');

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

/* ---- Stage 3 flight view (canvas) ----
 * The engine decides the outcome (resolveFlight). Everything below only DRAWS it, so the picture can
 * never disagree with the result. All visuals are drawn in code or use the team's own SVG assets. */

const TAU = Math.PI * 2;
const clamp01 = value => Math.max(0, Math.min(1, value));
const lerp = (from, to, t) => from + (to - from) * t;
const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
const smooth = t => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const EARTH_GLOBE_FILL = 0.85; // dest_earth.svg: the globe fills 85% of the picture's half-width

const flightImages = {};
/** Loads a destination picture once. If it is missing the view falls back to a coloured circle. */
function getFlightImage(key) {
  if (!flightImages[key]) {
    const img = new Image();
    img.src = `assets/dest_${key}.svg`;
    flightImages[key] = img;
  }
  return flightImages[key];
}

const flightBitmaps = {};
/** A 512px copy of a destination picture. Scaling a bitmap every frame is far cheaper than re-drawing the SVG. */
function getFlightBitmap(key) {
  if (flightBitmaps[key]) return flightBitmaps[key];
  const img = getFlightImage(key);
  if (!img.complete || img.naturalWidth === 0) return null;
  const bitmap = document.createElement('canvas');
  bitmap.width = 512;
  bitmap.height = 512;
  bitmap.getContext('2d').drawImage(img, 0, 0, 512, 512);
  flightBitmaps[key] = bitmap;
  return bitmap;
}

/**
 * Where everything sits on the map. Fractions of the view's half-size (see DATA.flightViz, not to scale).
 * Earth and Moon missions use a close-up around Earth; every other planet uses a Sun-centred map.
 */
function buildFlightGeometry(dest, orbitIndex) {
  const viz = DATA.flightViz;
  if (dest === 'earth' || dest === 'moon') {
    const local = viz.local;
    const isMoon = dest === 'moon';
    return {
      centerKey: 'earth',
      centerSize: local.earthSize,
      r1: local.parkRing,
      r2: isMoon ? local.moonRing : local.earthRings[orbitIndex] ?? local.earthRings[0],
      rings: isMoon ? [local.parkRing, local.moonRing] : [local.parkRing, ...local.earthRings],
      originKey: null,
      destKey: isMoon ? 'moon' : null
    };
  }

  const earthRing = viz.ringRadius.earth;
  const destRing = dest === 'sun' ? 0 : viz.ringRadius[dest];
  const widest = Math.max(earthRing, destRing);
  const zoom = viz.fitRadius / widest;
  return {
    centerKey: 'sun',
    centerSize: viz.sunSize,
    r1: earthRing * zoom,
    r2: destRing * zoom,
    rings: Object.values(viz.ringRadius).filter(ring => ring <= widest).map(ring => ring * zoom),
    originKey: 'earth',
    destKey: dest === 'sun' ? null : dest
  };
}

function createFlightView(canvas, telemetry) {
  const ctx = canvas.getContext('2d');
  const viz = DATA.flightViz;
  const hudText = CONTENT.flightHud;
  const dest = telemetry.C.dest;
  const orbitIndex = appState.mission.oi;
  const geo = buildFlightGeometry(dest, orbitIndex);
  const startAngle = (viz.startAngleDeg * Math.PI) / 180;
  const destName = getPlanetName(dest);

  // Same seed = same stars (Rule 8). Cosmetic only.
  const random = createSeededRng(appState.mission.seed);
  const stars = Array.from({ length: 90 }, () => ({
    x: random(), y: random(), r: 0.5 + random() * 1.1, a: 0.35 + random() * 0.65, phase: random() * TAU
  }));

  const state = {
    scene: 'ascent', // ascent | map | orbit
    sceneStart: performance.now(),
    ascent: 0,
    dim: 0,
    heat: false, // Sun dive: let the orange glow of the page show through
    craftT: 0, // 0..1 along the transfer arc
    showCraft: false,
    burn: 0, // engine flame 0..1
    dive: null, // 0..1 along the plunge path, or null
    boom: null,
    pulse: null,
    ready: false, // craft waiting for the burn
    halted: false, // the ascent stopped early (tumble on the pad)
    inset: 0 // pixels at the bottom kept free for the burn panel (eased)
  };

  const view = { skip: matchMedia('(prefers-reduced-motion: reduce)').matches };
  const craftWrap = $('#flcw');
  getFlightImage('earth');
  let width = 0;
  let height = 0;

  /* ---- sizing and geometry helpers ---- */
  function resizeIfNeeded() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return false;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = w;
    height = h;
    return true;
  }

  const getHalf = () => Math.min(width, height - state.inset) / 2 - 16;
  const getCx = () => width / 2;
  const getCy = () => (height - state.inset) / 2;

  /** Point on the transfer ellipse. Focus at the centre. t=0 is the departure ring, t=1 the target ring. */
  function arcPoint(t) {
    const half = getHalf();
    if (geo.r2 === 0) {
      // Sun mission: there is no transfer ellipse (its far end is the Sun itself), only a straight drop inward.
      const r = geo.r1 * half * (1 - t);
      return { x: getCx() + r * Math.cos(startAngle), y: getCy() + r * Math.sin(startAngle) };
    }
    const r1 = geo.r1 * half;
    const r2 = geo.r2 * half;
    const a = (r1 + r2) / 2;
    const e = Math.abs(r2 - r1) / (r1 + r2);
    const p = a * (1 - e * e);
    const trueAnomaly = (r2 >= r1 ? 0 : Math.PI) + Math.PI * t;
    const r = p / (1 + e * Math.cos(trueAnomaly));
    const angle = startAngle + Math.PI * t;
    return { x: getCx() + r * Math.cos(angle), y: getCy() + r * Math.sin(angle) };
  }

  /** Inward spiral used by the Sun dive. */
  function divePoint(u) {
    const r = geo.r1 * getHalf() * (1 - u) ** 1.4;
    const angle = startAngle + u * Math.PI * 1.5;
    return { x: getCx() + r * Math.cos(angle), y: getCy() + r * Math.sin(angle) };
  }

  const bodyAt = (ringFraction, angle) => ({
    x: getCx() + ringFraction * getHalf() * Math.cos(angle),
    y: getCy() + ringFraction * getHalf() * Math.sin(angle)
  });

  /* ---- drawing helpers ---- */
  function drawBody(key, x, y, size) {
    const img = getFlightImage(key);
    if (key === 'sun') {
      const glow = ctx.createRadialGradient(x, y, size * 0.2, x, y, size * 1.6);
      glow.addColorStop(0, 'rgba(255,200,87,0.55)');
      glow.addColorStop(1, 'rgba(255,200,87,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, size * 1.6, 0, TAU);
      ctx.fill();
    }
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.fillStyle = viz.color[key] || '#b8cde0';
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, TAU);
      ctx.fill();
    }
  }

  function drawLabel(text, x, y) {
    ctx.fillStyle = 'rgba(240,246,252,0.85)';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
  }

  function drawCraft(x, y, angle, flame, halo) {
    ctx.save();
    ctx.translate(x, y);
    if (halo) {
      ctx.strokeStyle = `rgba(255,200,87,${0.35 + 0.35 * Math.sin(performance.now() / 220)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, TAU);
      ctx.stroke();
    }
    ctx.rotate(angle);
    if (flame > 0) {
      const length = 10 + 22 * flame;
      const grad = ctx.createLinearGradient(-6, 0, -6 - length, 0);
      grad.addColorStop(0, 'rgba(255,240,180,0.95)');
      grad.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-6 - length, 0);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#f0f6fc';
    ctx.strokeStyle = '#ffc857';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-7, -6);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function tracePath(pointAt, from, to, steps = 60) {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const point = pointAt(lerp(from, to, i / steps));
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
  }

  /* ---- scenes ---- */

  /**
   * The ascent is ONE continuous camera move. The camera follows the craft while it zooms out, so the
   * flat ground becomes a curved horizon, then a globe, and the craft shrinks to the arrow used on the map.
   * u runs 0..1. Everything is expressed relative to the final map layout, so the last frame of the
   * ascent is exactly the first frame of the map (same Earth position and size, same craft position).
   */
  function ascentCamera(u) {
    const craftH = craftWrap.offsetHeight || 540;
    const craftW = craftWrap.offsetWidth || 520;
    const craftScale0 = Math.min(1, (0.46 * height) / craftH, (0.8 * width) / craftW);

    const craftEnd = arcPoint(0);
    const earthEnd = geo.originKey ? bodyAt(geo.r1, startAngle) : { x: getCx(), y: getCy() };
    const boxHalfEnd = geo.originKey ? viz.bodyPx.earth / 2 : geo.centerSize * getHalf();
    const surfaceEnd = boxHalfEnd * EARTH_GLOBE_FILL;
    const offEnd = { x: earthEnd.x - craftEnd.x, y: earthEnd.y - craftEnd.y };
    const offEndLength = Math.hypot(offEnd.x, offEnd.y);
    const thetaEnd = offEndLength > 1 ? Math.atan2(offEnd.y, offEnd.x) : Math.PI / 2;
    const gapEnd = offEndLength - surfaceEnd;

    const surface0 = 7 * height; // so large at lift-off that the ground looks flat
    const surface = surface0 * (surfaceEnd / surface0) ** (u ** 1.15);
    const sRel = (surface / surface0) ** 0.6;
    const scale = craftScale0 * sRel;

    const pan = smooth((u - 0.5) / 0.5);
    const gapPeak = 0.38 * height;
    const gap = lerp(gapPeak * smooth(u / 0.3), gapEnd, pan);
    const onPad = ((craftH * scale) / 2) * Math.max(0, 1 - u / 0.12);
    const distance = surface + gap + onPad;
    const theta = lerp(Math.PI / 2, thetaEnd, pan);
    const craft = {
      x: lerp(width / 2, craftEnd.x, pan),
      y: lerp(lerp(0.66 * height, 0.5 * height, smooth(u / 0.2)), craftEnd.y, pan)
    };
    return {
      surface,
      boxHalf: surface / EARTH_GLOBE_FILL,
      scale,
      sRel,
      craft,
      theta,
      earth: { x: craft.x + distance * Math.cos(theta), y: craft.y + distance * Math.sin(theta) },
      atmosphere: clamp01(1 - u / 0.4) // 1 = daylight sky, 0 = space
    };
  }

  function drawAscent(cam, now) {
    const u = state.ascent;
    const { surface, boxHalf, earth, craft, theta } = cam;

    // Thin haze on the horizon. Drawn first because the planet covers its own inside.
    const haze = Math.max(2, surface * 0.035);
    const hazeAlpha = 0.55 * clamp01((surface - 40) / 200);
    if (hazeAlpha > 0) {
      const glow = ctx.createRadialGradient(earth.x, earth.y, surface, earth.x, earth.y, surface + haze);
      glow.addColorStop(0, `rgba(150,205,255,${hazeAlpha})`);
      glow.addColorStop(1, 'rgba(150,205,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(earth.x, earth.y, surface + haze, 0, TAU);
      ctx.fill();
    }

    // Planet: green launch-site ground that turns to ocean blue, then the real Earth picture fades in.
    const mix = smooth(u / 0.3);
    const ground = [74, 107, 60];
    const ocean = [31, 95, 150];
    const colour = ground.map((value, index) => Math.round(lerp(value, ocean[index], mix)));
    const bitmap = getFlightBitmap('earth');
    const pictureAlpha = bitmap ? clamp01((700 - boxHalf) / 300) : 0;
    ctx.globalAlpha = 1 - pictureAlpha;
    ctx.fillStyle = `rgb(${colour.join(',')})`;
    ctx.beginPath();
    ctx.arc(earth.x, earth.y, surface, 0, TAU);
    ctx.fill();
    if (pictureAlpha > 0) {
      ctx.globalAlpha = pictureAlpha;
      ctx.drawImage(bitmap, earth.x - boxHalf, earth.y - boxHalf, boxHalf * 2, boxHalf * 2);
    }
    ctx.globalAlpha = 1;

    // Launch pad and two towers, only for the first moments.
    const padAlpha = clamp01(1 - u / 0.15);
    if (padAlpha > 0) {
      const top = { x: earth.x - surface * Math.cos(theta), y: earth.y - surface * Math.sin(theta) };
      const padW = (craftWrap.offsetWidth || 520) * cam.scale * 0.9;
      const towerH = (craftWrap.offsetHeight || 540) * cam.scale * 0.7;
      ctx.globalAlpha = padAlpha;
      ctx.fillStyle = '#56626e';
      ctx.fillRect(top.x - padW / 2, top.y - 10, padW, 10);
      ctx.fillStyle = '#7c8996';
      ctx.fillRect(top.x - padW / 2 - 14, top.y - towerH, 7, towerH);
      ctx.fillRect(top.x + padW / 2 + 7, top.y - towerH, 7, towerH);
      ctx.globalAlpha = 1;
    }

    // Once the rocket is too small to see, the arrow used on the map takes over.
    const domAlpha = clamp01((cam.sRel - 0.07) / 0.09);
    if (domAlpha < 1 && !state.halted) {
      const a = arcPoint(0);
      const b = arcPoint(0.01);
      ctx.globalAlpha = 1 - domAlpha;
      drawCraft(craft.x, craft.y, Math.atan2(b.y - a.y, b.x - a.x), 0, false);
      ctx.globalAlpha = 1;
    }
  }

  /** Places the real rocket picture (a DOM element) on the camera's craft position. */
  function placeCraftDom(cam) {
    const domAlpha = clamp01((cam.sRel - 0.07) / 0.09);
    craftWrap.style.transform =
      `translate(${cam.craft.x}px, ${cam.craft.y}px) translate(-50%, -50%) rotate(${cam.theta - Math.PI / 2}rad) scale(${cam.scale})`;
    craftWrap.style.opacity = String(domAlpha);
  }

  function drawMap(alpha) {
    const half = getHalf();
    const cx = getCx();
    const cy = getCy();
    ctx.globalAlpha = alpha;

    geo.rings.forEach(ring => {
      const isTarget = Math.abs(ring - geo.r2) < 1e-6;
      ctx.beginPath();
      ctx.arc(cx, cy, ring * half, 0, TAU);
      ctx.setLineDash(isTarget ? [6, 6] : []);
      ctx.strokeStyle = isTarget ? 'rgba(255,200,87,0.7)' : 'rgba(184,205,224,0.18)';
      ctx.lineWidth = isTarget ? 1.5 : 1;
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Earth is already on screen from the ascent, so it never fades; everything else fades in around it.
    const centerSize = geo.centerSize * half * 2;
    ctx.globalAlpha = geo.centerKey === 'earth' ? 1 : alpha;
    drawBody(geo.centerKey, cx, cy, centerSize);
    ctx.globalAlpha = alpha;
    drawLabel(geo.centerKey === 'sun' ? getPlanetName('sun') : getPlanetName('earth'), cx, cy + centerSize / 2 + 18);

    if (geo.originKey) {
      const origin = bodyAt(geo.r1, startAngle);
      ctx.globalAlpha = 1;
      drawBody(geo.originKey, origin.x, origin.y, viz.bodyPx.earth);
      ctx.globalAlpha = alpha;
      drawLabel(getPlanetName('earth'), origin.x, origin.y + viz.bodyPx.earth / 2 + 16);
    }
    if (geo.destKey) {
      const target = bodyAt(geo.r2, startAngle + Math.PI);
      const size = geo.destKey === 'moon' ? viz.bodyPx.moon : viz.bodyPx.planet;
      drawBody(geo.destKey, target.x, target.y, size);
      drawLabel(destName, target.x, target.y + size / 2 + 16);
    }

    // Planned transfer path (dashed) and the part already flown (solid).
    if (dest !== 'sun') {
      ctx.setLineDash([4, 5]);
      tracePath(arcPoint, 0, 1);
      ctx.strokeStyle = 'rgba(240,246,252,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      if (state.craftT > 0) {
        tracePath(arcPoint, 0, state.craftT);
        ctx.strokeStyle = '#ffc857';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffc857';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    if (state.dive !== null && state.dive > 0) {
      tracePath(divePoint, 0, state.dive);
      ctx.strokeStyle = '#ff7a3d';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff5a1f';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
    if (state.showCraft) drawMapCraft();
  }

  function drawMapCraft() {
    const age = state.boom ? performance.now() - state.boom.start : 0;
    if (state.boom && age > 150) return; // the craft is gone once it explodes
    if (state.dive !== null) {
      const point = divePoint(state.dive);
      const ahead = divePoint(Math.min(1, state.dive + 0.01));
      drawCraft(point.x, point.y, Math.atan2(ahead.y - point.y, ahead.x - point.x), 0.6, false);
      return;
    }
    const point = arcPoint(state.craftT);
    const ahead = arcPoint(Math.min(1, state.craftT + 0.01));
    const back = arcPoint(Math.max(0, state.craftT - 0.01));
    const heading = state.craftT < 0.01
      ? Math.atan2(ahead.y - back.y, ahead.x - back.x)
      : Math.atan2(ahead.y - point.y, ahead.x - point.x);
    drawCraft(point.x, point.y, heading, state.burn, state.ready);
  }

  function drawOrbit(alpha, now) {
    const half = getHalf();
    const cx = getCx();
    const cy = getCy();
    ctx.globalAlpha = alpha;

    const bodySize = 0.2 * half * 2;
    drawBody(dest, cx, cy, bodySize);
    drawLabel(destName, cx, cy + bodySize / 2 + 18);

    viz.orbitRings.forEach((ring, index) => {
      const isTarget = index === orbitIndex;
      ctx.beginPath();
      ctx.arc(cx, cy, ring * half, 0, TAU);
      ctx.setLineDash(isTarget ? [] : [3, 6]);
      ctx.strokeStyle = isTarget ? 'rgba(127,227,184,0.85)' : 'rgba(184,205,224,0.18)';
      ctx.lineWidth = isTarget ? 2 : 1;
      ctx.stroke();
    });
    ctx.setLineDash([]);

    const ring = viz.orbitRings[orbitIndex] ?? viz.orbitRings[0];
    const angle = startAngle - now * (0.0016 / (0.5 + ring));
    const x = cx + ring * half * Math.cos(angle);
    const y = cy + ring * half * Math.sin(angle);
    drawCraft(x, y, angle - Math.PI / 2, 0, false);
    ctx.globalAlpha = 1;
  }

  function drawBoom(now) {
    if (!state.boom) return;
    const age = now - state.boom.start;
    if (age > 1100) return;
    const t = age / 1100;
    const point = state.boom.at || (state.dive !== null ? divePoint(state.dive) : arcPoint(state.craftT));
    ctx.strokeStyle = `rgba(255,200,120,${1 - t})`;
    ctx.lineWidth = 4 * (1 - t) + 1;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 8 + t * 60, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * TAU;
      ctx.beginPath();
      ctx.moveTo(point.x + Math.cos(angle) * (10 + t * 30), point.y + Math.sin(angle) * (10 + t * 30));
      ctx.lineTo(point.x + Math.cos(angle) * (16 + t * 70), point.y + Math.sin(angle) * (16 + t * 70));
      ctx.stroke();
    }
  }

  function drawPulse(now) {
    if (!state.pulse) return;
    const t = (now - state.pulse.start) / 700;
    if (t > 1) return;
    ctx.strokeStyle = state.pulse.good ? `rgba(127,227,184,${0.7 * (1 - t)})` : `rgba(255,133,109,${0.8 * (1 - t)})`;
    ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, width, height);
  }

  /* ---- main draw loop ---- */
  function frame(now) {
    if (!canvas.isConnected) return; // a new launch replaced this view
    requestAnimationFrame(frame);
    if (canvas.offsetParent === null || !resizeIfNeeded()) return; // hidden stage: skip drawing

    ctx.clearRect(0, 0, width, height);

    // Slide the map up while the burn panel is open so the panel never hides the craft or the target.
    const panel = $('#burn');
    const insetTarget = panel && !panel.hidden ? panel.offsetHeight + 24 : 0;
    state.inset += (insetTarget - state.inset) * 0.2;
    if (Math.abs(insetTarget - state.inset) < 0.5) state.inset = insetTarget;

    const cam = state.scene === 'ascent' ? ascentCamera(state.ascent) : null;
    const dimTarget = cam ? 0.85 * (1 - cam.atmosphere) : state.heat ? 0.2 : 0.85;
    state.dim = cam ? dimTarget : state.dim + (dimTarget - state.dim) * 0.08;
    ctx.fillStyle = `rgba(3,10,22,${state.dim})`;
    ctx.fillRect(0, 0, width, height);

    if (cam && cam.atmosphere > 0) {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      const skyAlpha = Math.min(1, cam.atmosphere * 1.6);
      sky.addColorStop(0, `rgba(28,84,150,${skyAlpha})`);
      sky.addColorStop(1, `rgba(170,214,250,${skyAlpha})`);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);
    }

    const starVisibility = cam ? 1 - cam.atmosphere : 1;
    stars.forEach(star => {
      const twinkle = 0.75 + 0.25 * Math.sin(now / 700 + star.phase);
      ctx.fillStyle = `rgba(240,246,252,${star.a * twinkle * starVisibility})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.r, 0, TAU);
      ctx.fill();
    });

    const fade = clamp01((now - state.sceneStart) / 600);
    if (cam) {
      drawAscent(cam, now);
      placeCraftDom(cam);
    } else if (state.scene === 'map') drawMap(fade);
    else drawOrbit(fade, now);

    drawBoom(now);
    drawPulse(now);
  }

  /* ---- tweens ---- */
  const isSkipping = () => view.skip || document.hidden;
  function tween(ms, onFrame) {
    return new Promise(resolve => {
      const startedAt = performance.now();
      const tick = now => {
        const t = isSkipping() ? 1 : clamp01((now - startedAt) / ms);
        onFrame(t);
        if (t >= 1) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  const hud = $('#flhud');
  view.setHud = (phase, detail = '') => {
    hud.querySelector('.flph').textContent = phase;
    hud.querySelector('.flday').textContent = detail;
    canvas.setAttribute('aria-label', `${hudText.canvasLabel}: ${phase}${detail ? `, ${detail}` : ''}`);
  };

  /* ---- public controls used by startLaunchSequence ---- */
  view.setScene = name => {
    state.scene = name;
    state.sceneStart = performance.now();
    if (name !== 'ascent') craftWrap.style.opacity = '0'; // the arrow on the canvas takes over from the rocket picture
  };
  view.ascend = () => {
    let shownPhase = '';
    return tween(viz.ascendMs, t => {
      if (state.halted) return;
      state.ascent = t;
      const phase = t < 0.3 ? hudText.ascent : t < 0.7 ? hudText.atmosphere : hudText.reachOrbit;
      if (phase !== shownPhase) {
        shownPhase = phase;
        view.setHud(phase);
      }
    });
  };
  /** The rocket is lost on the way up: freeze the camera and blow it up where it is. */
  view.haltAscent = () => {
    state.halted = true;
    state.boom = { start: performance.now(), at: { ...ascentCamera(state.ascent).craft } };
    view.setHud(hudText.lost);
  };
  view.showMap = () => {
    state.craftT = 0;
    state.showCraft = true;
    view.setScene('map');
    view.setHud(hudText.ready, hudText.notToScale);
  };
  view.setReady = isReady => { state.ready = isReady; };
  view.setBurn = isBurning => {
    state.burn = isBurning ? 1 : 0;
    if (isBurning) view.setHud(hudText.burning);
  };
  view.coast = (to, stallAtEnd = false) => {
    const from = state.craftT;
    state.ready = false;
    state.burn = 0;
    const ms = Math.max(500, viz.coastMs * (to - from));
    return tween(ms, t => {
      state.craftT = lerp(from, to, easeInOut(t));
      const days = Math.round(state.craftT * telemetry.days);
      view.setHud(
        fillTemplate(hudText.coast, { name: destName }),
        fillTemplate(hudText.day, { day: days, days: telemetry.days })
      );
    }).then(() => {
      if (stallAtEnd) view.setHud(hudText.stalled);
    });
  };
  view.startDive = () => {
    state.heat = true;
    state.dive = 0;
    state.ready = false;
    view.setHud(hudText.dive);
    return tween(viz.diveMs, t => { state.dive = t ** 1.6; });
  };
  view.explode = () => {
    state.boom = { start: performance.now() };
    view.setHud(hudText.lost);
  };
  view.pulse = good => { state.pulse = { start: performance.now(), good }; };
  view.arrive = orbitName => {
    state.showCraft = false;
    view.setScene('orbit');
    view.setHud(fillTemplate(hudText.orbit, { orbit: orbitName }));
  };
  view.finish = outcome => {
    if (outcome === 'lost') {
      view.setHud(hudText.lost);
    } else {
      view.setHud(hudText.complete, fillTemplate(hudText.orbit, { orbit: telemetry.O.n.toLowerCase() }));
    }
  };

  requestAnimationFrame(frame);
  return view;
}

/* ---- Stage 3: manual burns ---- */

/**
 * Plays one burn minigame ('departure' or 'insertion') and resolves with { burn, all }.
 * `burn` is scoreBurn(fill, kind), or null when the player picks Auto-pilot. `all` is true when they pick
 * "Auto-pilot all burns" (that button is only shown when `offerAll` is true).
 * Hold the button (or Space / Enter) and let go inside the green zone. One try, no retries.
 * The UI only measures how long the player held. The scoring is the engine's scoreBurn().
 */
function playBurnMinigame(view, kind, offerAll) {
  const model = DATA.flightModel;
  const spec = model.burns[kind];
  const text = CONTENT.burn;
  const panel = $('#burn');
  const fillEl = $('#burnfill');
  const stateEl = $('#burnstate');
  const holdBtn = $('#burnbtn');
  const autoBtn = $('#burnauto');
  const allBtn = $('#burnall');

  const zoneStart = spec.target - spec.zoneHalfWidth;
  const zoneEnd = spec.target + spec.zoneHalfWidth;
  $('#burnzone').style.left = `${zoneStart * 100}%`;
  $('#burnzone').style.width = `${(zoneEnd - zoneStart) * 100}%`;
  $('#burnmark').style.left = `${spec.target * 100}%`;
  $('#burngauge').setAttribute('aria-label', fillTemplate(text.gaugeLabel, {
    zoneStartPct: zoneStart, zoneEndPct: zoneEnd
  }));
  $('#burntxt').textContent = fillTemplate(text[kind].prompt, { maxBonusPct: spec.weight * model.burnBonusMax });
  holdBtn.textContent = text.hold;
  autoBtn.textContent = text.auto;
  allBtn.textContent = text.autoAll;
  // The buttons are switched off when a burn ends, so switch them back on for the next one.
  holdBtn.disabled = false;
  autoBtn.disabled = false;
  allBtn.disabled = false;
  allBtn.hidden = !offerAll;
  stateEl.textContent = text.ready;
  fillEl.style.width = '0%';
  fillEl.classList.remove('in');
  panel.hidden = false;
  $('#flv').classList.add('burning');
  if (text[kind].hud) view.setHud(text[kind].hud);
  view.setReady(true);
  holdBtn.focus();

  return new Promise(resolve => {
    let holdStart = null;
    let finished = false;
    let rafId = 0;

    const getFill = () =>
      holdStart === null ? 0 : Math.min(1, (performance.now() - holdStart) / (spec.fillSeconds * 1000));

    const paint = () => {
      const fill = getFill();
      fillEl.style.width = `${fill * 100}%`;
      fillEl.classList.toggle('in', fill >= zoneStart && fill <= zoneEnd);
      stateEl.textContent = fill < zoneStart ? text.low : fill <= zoneEnd ? text.inZone : text.high;
      if (fill >= 1) finish(false, false);
      else if (holdStart !== null && !finished) rafId = requestAnimationFrame(paint);
    };

    const start = () => {
      if (holdStart !== null || finished) return;
      holdStart = performance.now();
      holdBtn.textContent = text.firing;
      view.setBurn(true);
      AudioEngine.launch();
      rafId = requestAnimationFrame(paint);
    };

    function finish(isAuto, isAll) {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      view.setBurn(false);
      holdBtn.disabled = true;
      autoBtn.disabled = true;
      allBtn.disabled = true;
      resolve({ burn: isAuto ? null : scoreBurn(getFill(), kind), all: isAll });
    }

    const release = () => {
      if (holdStart !== null) finish(false, false);
    };

    // Space / Enter behave like holding the button, except when another button has focus.
    function onKeyDown(event) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      if (event.target.closest('button') && event.target.id !== 'burnbtn') return;
      event.preventDefault();
      if (!event.repeat) start();
    }
    function onKeyUp(event) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      if (event.target.closest('button') && event.target.id !== 'burnbtn') return;
      event.preventDefault();
      release();
    }
    function onPointerUp() {
      release();
    }

    holdBtn.onpointerdown = event => {
      event.preventDefault();
      start();
    };
    holdBtn.oncontextmenu = event => event.preventDefault();
    autoBtn.onclick = () => finish(true, false);
    allBtn.onclick = () => finish(true, true);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  });
}

/** Turns one engine flight step into a log line. The engine decides; this only describes. */
function describeFlightStep(step) {
  if (step.key === 'event') {
    const text = CONTENT.eventText[step.values.eventId];
    return `<b>Event: ${text.n}.</b> ${text.txt} ${step.ok ? text.immT : text.hitT}`;
  }
  if (step.key === 'briefing') return buildPlanetBriefing(step.values.contractId, true);
  return fillTemplate(CONTENT.flightLog[step.key], step.values);
}

const getFlightStepClass = step =>
  !step.ok ? 'bad' : ['ascent', 'arrival', 'event', 'burn_departure', 'burn_insertion'].includes(step.key) ? 'ok' : '';

export async function startLaunchSequence() {
  const mission = appState.mission;
  const telemetry = mission.d;
  // The Auto-pilot result. A manual burn can only add science to this, never take any away.
  let flight = resolveFlight(telemetry);
  mission.res = null;

  navigateToStage(3);
  appState.isFlying = true;

  $('#s3').innerHTML = `
    <div class="fl3">
      <div id="flv">
        <canvas id="flcv" role="img" aria-label="${CONTENT.flightHud.canvasLabel}"></canvas>
        <div id="flcw"><div class="flc" id="fl">${renderFlightSpacecraft()}</div></div>
        <div id="flhud"><span class="flph"></span><span class="flday"></span></div>
        <button type="button" id="fskip">${CONTENT.flightHud.skip}</button>
        <button type="button" class="go" id="fnext" hidden data-a="deb">See debrief &rarr;</button>
        <div id="burn" hidden>
          <p id="burntxt"></p>
          <div id="burngauge" role="img"><div id="burnzone"></div><div id="burnmark"></div><div id="burnfill"></div></div>
          <p id="burnstate"></p>
          <div class="row">
            <button type="button" class="go" id="burnbtn" aria-describedby="burntxt burnstate"></button>
            <button type="button" id="burnauto"></button>
            <button type="button" id="burnall" hidden></button>
          </div>
        </div>
      </div>
      <div class="box" id="logbox" aria-live="polite">
        <h2>${CONTENT.flightHud.logTitle}</h2>
        <div id="log"></div>
      </div>
    </div>
  `;
  $('#nav').querySelectorAll('button').forEach(btn => { btn.disabled = true; });

  const logEl = $('#log');
  const craftEl = $('#fl');
  const view = createFlightView($('#flcv'), telemetry);
  $('#fskip').onclick = () => { view.skip = true; };

  const logMessage = async (html, statusClass = '') => {
    AudioEngine.tick();
    logEl.innerHTML += `<p class="${statusClass}">${html}</p>`;
    $('#logbox').scrollTop = $('#logbox').scrollHeight; // newest line stays in view
    await delay(view.skip ? 120 : 900);
  };

  void craftEl.offsetWidth;
  craftEl.classList.add('fly');
  AudioEngine.launch();

  let steps = flight.steps;
  let ascentDone = Promise.resolve();
  let diveDone = Promise.resolve();
  let haveMs = 0;
  let needMs = 1;
  let burnOffered = false;
  let autoAll = false; // the player picked "Auto-pilot all burns"
  const burns = {}; // the burns flown by hand so far: { departure, insertion }

  /**
   * Offers one manual burn and shows the result. A burn flown by hand is re-resolved into the flight; steps
   * up to the current one stay identical and the new burn step lands right after it, so playback just carries on.
   * Resolves true when the player picked "Auto-pilot all burns".
   */
  const offerBurn = async (kind, offerAll) => {
    const { burn, all } = await playBurnMinigame(view, kind, offerAll);
    if (burn) {
      burns[kind] = burn;
      flight = resolveFlight(telemetry, burns);
      steps = flight.steps;
    }
    $('#burnstate').textContent = all
      ? CONTENT.burn.autoAllResult
      : !burn
        ? CONTENT.burn.autoResult
        : burn.quality > 0
          ? fillTemplate(CONTENT.burn.result, { precisionPct: burn.quality, bonusPct: burn.bonus })
          : CONTENT.burn.missed;
    view.pulse(!burn || burn.quality > 0);
    await delay(view.skip ? 0 : 900);
    $('#burn').hidden = true;
    $('#flv').classList.remove('burning');
    return all;
  };

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const next = steps[i + 1];

    if (step.key === 'liftoff') ascentDone = view.ascend();
    if (step.key === 'ascent') {
      await ascentDone;
      view.showMap();
    }
    if (step.key === 'transfer') ({ haveMs, needMs } = step.values);
    if (step.key === 'sun_dive' && $('#flv').classList.contains('sunhit') === false) {
      $('#flv').classList.add('sunhit');
      diveDone = view.startDive();
    }
    if (step.key === 'sun_boom') {
      await diveDone;
      await delay(view.skip ? 0 : 400);
    }
    if (step.key === 'deltav_short') await view.coast(Math.max(0.08, Math.min(0.92, haveMs / needMs)), true);
    if (step.key === 'ion_short') await view.coast(0.18, true);
    // The orbit insertion burn is offered on arrival, while the craft is still on the map at its target.
    const canOfferInsertion = step.key === 'arrival' && !autoAll && flight.outcome !== 'lost';
    if (step.key === 'arrival') {
      await view.coast(1);
      if (!canOfferInsertion) view.arrive(telemetry.O.n.toLowerCase());
    }
    if (step.key === 'event') view.pulse(step.ok);
    if (step.fatal) {
      if (step.key === 'tumble') {
        craftEl.classList.add('boom');
        view.haltAscent();
      } else {
        view.explode();
      }
      AudioEngine.fail();
    }

    await logMessage(describeFlightStep(step), getFlightStepClass(step));

    // Offer the departure burn once, right after the transfer line, only when the craft really survives it.
    const canOfferBurn = step.key === 'transfer' && step.ok && next && next.key === 'arrival' && flight.outcome !== 'lost';
    if (canOfferBurn && !burnOffered) {
      burnOffered = true;
      autoAll = await offerBurn('departure', true);
    }

    // Then the orbit insertion burn (unless the player chose Auto-pilot all), and only then the orbit view.
    if (canOfferInsertion) {
      await offerBurn('insertion', false);
      view.setReady(false);
      view.arrive(telemetry.O.n.toLowerCase());
    }
  }

  view.finish(flight.outcome);
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

  const connectedUids = getConnectedPartUids();
  const news = recordMission({
    out: flight.outcome,
    C: contract,
    d: mission.d,
    st: flight.stars,
    rtg: mission.parts.some(p => p.id === 'rtg' && connectedUids.has(p.u)),
    sci: flight.science,
    hard: mission.hard
  });

  mission.res = {
    out: flight.outcome,
    why: flight.reasons,
    sci: flight.science,
    st: flight.stars,
    score: flight.score,
    rel: flight.reliability,
    news
  };
  appState.isFlying = false;

  const levelUp = news.find(item => item.k === 'lv');
  if (levelUp) showToast(`Level up! Level ${levelUp.lv}: ${levelUp.title}. ${levelUp.planet} unlocked.`);
  updateCareerButton();

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
  const { out, why, sci, st, score, news } = mission.res;

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
      ${renderCareerNews(news)}
      <p><b>Why it went this way &amp; what to change next</b></p>
      <ul>${(why.length ? why : ['All six resource budgets maintained healthy engineering margins.']).map(reason => `<li>${reason}</li>`).join('')}</ul>
      <p><b>Star criteria:</b> 2&#9733; requires ${contract.target} science pts (achieved ${sci.toFixed(0)}). 3&#9733; also requires all four role sign-offs (${missingSignOffs}) and total cost under $${Math.round(contract.cap * DATA.scoringWeights.threeStarBudgetFraction)}M (spent $${telemetry.cost}M).</p>
      ${resourceMarginsTable}
      ${traceabilityTable}
      ${heritageList}
      <p><b>Destination briefing: ${contract.n}</b></p>
      ${buildPlanetBriefing(contract.id, true)}
      <div class="row" style="margin-top:12px;">
        <button type="button" data-a="go2">Edit and re-simulate</button>
        <button type="button" data-a="go1">New mission</button>
      </div>
    </div>
  `;
}

/* ---- Career mode: debrief news and the Career window ---- */

function renderCareerNews(news = []) {
  const career = getCareer();
  const next = getNextGate();
  const items = news.map(item => item.k === 'lv'
    ? `<b class="g">LEVEL UP! Level ${item.lv}: ${item.title}</b><br>Unlocked: ${item.planet}. The destination list is back in solar-system order.<br>`
    : `<b class="y">Achievement:</b> ${item.n} - ${item.t}<br>`
  ).join('');

  const nextLine = next
    ? `Next unlock: ${getPlanetName(next.id)} (Level ${next.lv}): ${describeGateNeed(next)}.`
    : 'Every destination is unlocked.';

  const tip = career.streak >= 2
    ? `<br><b class="y">Mission Control tip:</b> ${career.streak} losses in a row. Press Starter ship in the Build screen (it reaches Earth and the Moon safely; Mars and beyond need extra tanks and a bigger launcher), keep the Rookie 10% margin, and fix every red meter before you launch. Each red meter explains how to fix it.`
    : '';

  return `<div class="pin">${items}<b>Career:</b> Level ${getCareerLevel()} - ${getCareerRank()}. ${nextLine}${tip}</div>`;
}

export function showCareerModal() {
  const career = getCareer();
  const achievementCount = Object.keys(career.ach).length;

  $('#rev').innerHTML = `
    <div class="box modal-box" style="width: min(900px, 96vw);">
      <h2>Career: Level ${getCareerLevel()} - ${getCareerRank()}</h2>
      <p>Safe arrivals: ${career.tot} - Missions lost: ${career.lost}. A safe arrival is any mission that is not lost. Levels go up in steps of 2. A good arrival is a safe arrival that also collects at least the threshold science.</p>
      <table class="rt">
        <tr><th>Level</th><th>Title</th><th>Unlocks</th><th>Requirement</th><th></th></tr>
        <tr><td>0</td><td>Launch Pad Rookie</td><td>Earth, Moon, Mars</td><td>Start here</td><td class="g">Unlocked</td></tr>
        ${GATES.map(gate => {
          const unlocked = career.un.includes(gate.id);
          return `<tr><td>${gate.lv}</td><td>${gate.title}</td><td>${getPlanetName(gate.id)}</td><td>${describeGateNeed(gate)}</td><td class="${unlocked ? 'g' : 'y'}">${unlocked ? 'Unlocked' : 'Locked'}</td></tr>`;
        }).join('')}
      </table>
      <h3>Achievements (${achievementCount}/${ACHIEVEMENTS.length})</h3>
      ${ACHIEVEMENTS.map(a => `<div class="chk ${career.ach[a.id] ? 'ok' : ''}">${career.ach[a.id] ? '&#9733;' : '&#9734;'} <b>${a.n}</b> - ${a.t}</div>`).join('')}
      <div class="row" style="margin-top:12px;">
        <button type="button" id="rback">Close</button>
        <button type="button" id="creset">Reset career</button>
      </div>
    </div>
  `;
  $('#rev').hidden = false;
}
