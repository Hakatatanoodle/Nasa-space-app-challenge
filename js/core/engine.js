/* File: js/core/engine.js
 * Owner: Person A (Ashmin)
 * AI-assisted: YES — Gemini, 2026-11-14. Reviewed by a human: NO.
 * Sources used: NASA_CUBESAT101, JPL_CML
 */
import { DATA } from '../api/mockData.js';
import { CONTENT } from '../content.js';
import { PART_DIMENSIONS, ATTACHMENT_NODES, MAX_PARTS, DEFAULT_SEED } from '../config.js';
import {
  appState,
  getNodeCategory,
  getDimensionKey,
  canCurrentRoleEditPart,
  saveUndoSnapshot
} from './state.js';

/**
 * Deterministic Mulberry32 PRNG (Rule 8: Same inputs + same seed = same output).
 */
export function createSeededRng(seed = DEFAULT_SEED) {
  let state = seed >>> 0;
  return function nextRandom() {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- Pure Geometry & Node Graph Helpers ---- */

export const findPartByUid = uid => appState.mission.parts.find(p => p.u === uid);
export const getPartSize = part => PART_DIMENSIONS[getDimensionKey(part.id)];
export const isStackNode = nodeName => ['top', 'bottom', 'base'].includes(nodeName);

export function getNodeOffset(part, nodeName) {
  const [width, height] = getPartSize(part);
  const node = ATTACHMENT_NODES[getNodeCategory(part.id)].find(n => n[0] === nodeName);
  let x = (node[1] - 0.5) * width;
  let y = (node[2] - 0.5) * height;
  if (part.flip) x = -x;

  const rad = (part.rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [x * cos - y * sin, x * sin + y * cos];
}

export function getNodeWorldPosition(part, nodeName) {
  const [offsetX, offsetY] = getNodeOffset(part, nodeName);
  return [part.x + offsetX, part.y + offsetY];
}

export function getSubtreeUids(rootUid) {
  const uids = [rootUid];
  for (let i = 0; i < uids.length; i++) {
    appState.mission.parts.forEach(part => {
      if (part.par === uids[i]) uids.push(part.u);
    });
  }
  return uids;
}

export function getOccupiedNodes() {
  const occupied = new Set();
  appState.mission.parts.forEach(part => {
    if (part.par != null) {
      occupied.add(`${part.par}:${part.pn}`);
      occupied.add(`${part.u}:${part.cn}`);
    }
  });
  return occupied;
}

export function getConnectedPartUids() {
  const connected = new Set();
  appState.mission.parts.forEach(part => {
    let current = part;
    let depth = 0;
    while (current && current.par != null && depth++ < 80) {
      current = findPartByUid(current.par);
    }
    if (current && getNodeCategory(current.id) === 'bus') {
      connected.add(part.u);
    }
  });
  return connected;
}

/* ---- Spacecraft Assembly Operations ---- */

export function createPartInstance(partId, x, y) {
  const part = {
    u: appState.mission.nu++,
    id: partId,
    x,
    y,
    rot: 0,
    flip: 0,
    par: null
  };
  appState.mission.parts.push(part);
  return part;
}

export function movePartSubtree(rootUid, deltaX, deltaY) {
  getSubtreeUids(rootUid).forEach(uid => {
    const part = findPartByUid(uid);
    part.x += deltaX;
    part.y += deltaY;
  });
}

export function deletePartSubtree(rootUid) {
  const toDelete = new Set(getSubtreeUids(rootUid));
  appState.mission.parts = appState.mission.parts.filter(part => !toDelete.has(part.u));
}

export function attachParts(child, childNode, host, hostNode) {
  const hasChildren = appState.mission.parts.some(p => p.par === child.u);
  if (!isStackNode(childNode) && !isStackNode(hostNode) && !hasChildren) {
    child.rot = 0;
    child.flip = hostNode.startsWith('L') ? 1 : 0;
  }

  const [hostX, hostY] = getNodeWorldPosition(host, hostNode);
  const [childOffsetX, childOffsetY] = getNodeOffset(child, childNode);
  movePartSubtree(child.u, hostX - childOffsetX - child.x, hostY - childOffsetY - child.y);

  child.par = host.u;
  child.cn = childNode;
  child.pn = hostNode;
}

export function mirrorPartIfEnabled(childPart) {
  const host = findPartByUid(childPart.par);
  if (
    !appState.mission.mirror ||
    isStackNode(childPart.pn) ||
    host.rot !== 0 ||
    DATA.parts[childPart.id].g === 'sci' ||
    appState.mission.parts.length >= MAX_PARTS
  ) {
    return;
  }

  const oppositeSide = childPart.pn.startsWith('L') ? 'R' : 'L';
  const oppositeNode = oppositeSide + childPart.pn.slice(1);
  if (getOccupiedNodes().has(`${host.u}:${oppositeNode}`)) return;

  const twinPart = createPartInstance(childPart.id, 0, 0);
  attachParts(twinPart, childPart.cn, host, oppositeNode);
}

export function buildStarterSpacecraft() {
  appState.mission.parts = [];
  appState.mission.nu = 1;

  const bus = createPartInstance('bus_rad', 400, 170);
  const tank = createPartInstance('tank', 400, 300);
  const engine = createPartInstance('chem', 400, 420);

  attachParts(tank, 'top', bus, 'bottom');
  attachParts(engine, 'top', tank, 'bottom');

  const mountPart = (partId, host, hostNode) => {
    const part = createPartInstance(partId, 0, 0);
    const childNode = getNodeCategory(partId) === 'ant' ? 'base' : 'in';
    attachParts(part, childNode, host, hostNode);
    return part;
  };

  mirrorPartIfEnabled(mountPart('sol_s', bus, 'R1'));
  mountPart('i_cam', bus, 'R2');
  mountPart('ant_lg', bus, 'top');
  mountPart('bat', tank, 'R1');
}

/**
 * Loads an intentionally overweight / under-fueled preset for the "Try a Failing Design" demo.
 */
export function buildFailingDemoSpacecraft() {
  appState.mission.ci = 2; // Mars mission
  appState.mission.oi = 0; // Low Mars orbit (5.6 km/s delta-v)
  appState.mission.L = 'medium'; // 9,000 kg limit
  appState.mission.hard = 1;
  appState.mission.parts = [];
  appState.mission.nu = 1;

  const bus = createPartInstance('bus_std', 400, 170);
  const tank1 = createPartInstance('tank', 400, 300);
  const tank2 = createPartInstance('tank', 400, 430);
  const engine = createPartInstance('chem', 400, 550);

  attachParts(tank1, 'top', bus, 'bottom');
  attachParts(tank2, 'top', tank1, 'bottom');
  attachParts(engine, 'top', tank2, 'bottom');

  const radar = createPartInstance('i_radar', 0, 0);
  attachParts(radar, 'in', bus, 'R1');
}

export function autoAttachPart(partId) {
  if (!canCurrentRoleEditPart(partId)) {
    return { ok: false, message: 'That part belongs to another role. Pass the keyboard.' };
  }

  const category = getNodeCategory(partId);
  const connected = getConnectedPartUids();
  const hosts = appState.mission.parts
    .filter(p => connected.has(p.u))
    .sort((a, b) => a.y - b.y);
  const bus = appState.mission.parts.find(p => getNodeCategory(p.id) === 'bus');

  if (category === 'bus') {
    if (bus) {
      bus.id = partId;
    } else {
      saveUndoSnapshot();
      createPartInstance(partId, 400, 170);
    }
    return { ok: true };
  }

  if (!bus) {
    return { ok: false, message: 'Start with a spacecraft bus: it is the root everything bolts onto.' };
  }
  if (appState.mission.parts.length >= MAX_PARTS) {
    return { ok: false, message: `Part limit reached (${MAX_PARTS}).` };
  }

  const occupied = getOccupiedNodes();
  const isNodeFree = (host, node) => !occupied.has(`${host.u}:${node}`);
  const hasNode = (host, node) => ATTACHMENT_NODES[getNodeCategory(host.id)].some(n => n[0] === node);

  saveUndoSnapshot();

  if (category === 'eng') {
    const existingEngine = appState.mission.parts.find(p => getNodeCategory(p.id) === 'eng');
    if (existingEngine) {
      existingEngine.id = partId;
      if (existingEngine.par != null) {
        attachParts(existingEngine, 'top', findPartByUid(existingEngine.par), existingEngine.pn);
      }
      return { ok: true };
    }
    const bottomHost = [...hosts].reverse().find(h => hasNode(h, 'bottom') && isNodeFree(h, 'bottom'));
    if (!bottomHost) return { ok: false, message: 'Nothing to bolt an engine under.' };
    attachParts(createPartInstance(partId, 0, 0), 'top', bottomHost, 'bottom');
    return { ok: true };
  }

  if (category === 'tank') {
    const lowestStack = [...hosts].reverse().find(h => ['bus', 'tank'].includes(getNodeCategory(h.id)));
    const attachedBottom = appState.mission.parts.find(p => p.par === lowestStack.u && p.pn === 'bottom');
    const newTank = createPartInstance('tank', 0, 0);

    if (attachedBottom) {
      attachedBottom.par = null;
      attachParts(newTank, 'top', lowestStack, 'bottom');
      attachParts(attachedBottom, attachedBottom.cn, newTank, 'bottom');
    } else {
      attachParts(newTank, 'top', lowestStack, 'bottom');
    }
    return { ok: true };
  }

  if (category === 'ant') {
    const topHost = hosts.find(h => ['bus', 'tank'].includes(getNodeCategory(h.id)) && isNodeFree(h, 'top'));
    if (!topHost) return { ok: false, message: 'No free mounting point on top. Move something first.' };
    attachParts(createPartInstance(partId, 0, 0), 'base', topHost, 'top');
    return { ok: true };
  }

  for (const host of hosts) {
    for (const sideNode of ['R1', 'L1', 'R2', 'L2']) {
      if (hasNode(host, sideNode) && isNodeFree(host, sideNode)) {
        const part = createPartInstance(partId, 0, 0);
        attachParts(part, 'in', host, sideNode);
        mirrorPartIfEnabled(part);
        return { ok: true };
      }
    }
  }

  return { ok: false, message: 'No free mounting point. Drag a part off the ship, or add a tank for more mounts.' };
}

/* ---- Pure Physics & Engineering Evaluation ---- */

export function calculateTelemetry(missionInput = appState.mission) {
  const threshold = missionInput.hard ? DATA.marginPolicies.hard.v : DATA.marginPolicies.easy.v;
  appState.marginThreshold = threshold;

  const contract = DATA.contracts[missionInput.ci];
  const orbit = contract.orbits[missionInput.oi];
  const launcher = DATA.launchers[missionInput.L];
  const tankSpec = DATA.tank;

  const connectedUids = getConnectedPartUids();
  const connectedParts = missionInput.parts.filter(p => connectedUids.has(p.u));

  const busPart = connectedParts.find(p => getNodeCategory(p.id) === 'bus');
  const engineParts = connectedParts.filter(p => getNodeCategory(p.id) === 'eng');

  const busSpec = DATA.parts[busPart ? busPart.id : 'bus_std'];
  const engineSpec = DATA.engines[engineParts[0] ? engineParts[0].id : 'chem'];

  const telemetry = {
    C: contract,
    O: orbit,
    B: busSpec,
    E: engineSpec,
    L: launcher,
    dry: busSpec.m + engineParts.length * engineSpec.m,
    load: busSpec.pw,
    gen: 0,
    wh: 0,
    mb: 0,
    gb: DATA.constants.baseStorageGb.value,
    rec: 0,
    data: 0,
    sci: 0,
    tk: 0,
    cost: busSpec.c + engineParts.length * engineSpec.c + launcher.c
  };

  let propellantMass = 0;
  let weightedX = 0;
  let weightedY = 0;
  let totalMass = 0;
  const seenInstruments = {};

  connectedParts.forEach(part => {
    let partMass = 0;
    const category = getNodeCategory(part.id);

    if (part.id === 'tank') {
      telemetry.tk++;
      telemetry.dry += tankSpec.dry;
      telemetry.cost += tankSpec.c;
      propellantMass += tankSpec.prop;
      partMass = tankSpec.dry + tankSpec.prop;
    } else if (category === 'eng') {
      partMass = engineSpec.m;
    } else if (category === 'bus') {
      partMass = busSpec.m;
    } else {
      const spec = DATA.parts[part.id];
      partMass = spec.m;
      telemetry.dry += spec.m;
      telemetry.cost += spec.c;
      telemetry.load += spec.pw || 0;
      telemetry.gen += spec.gen || 0;
      telemetry.wh += spec.wh || 0;
      telemetry.mb = Math.max(telemetry.mb, spec.mb || 0);

      if (spec.gb) {
        telemetry.gb += spec.gb;
        telemetry.rec++;
      }
      telemetry.data += spec.data || 0;
      if (spec.sci) {
        telemetry.sci += spec.sci * (seenInstruments[part.id] ? 0.25 : 1);
        seenInstruments[part.id] = true;
      }
    }

    totalMass += partMass;
    weightedX += partMass * part.x;
    weightedY += partMass * part.y;
  });

  telemetry.comx = totalMass ? weightedX / totalMass : 0;
  telemetry.comy = totalMass ? weightedY / totalMass : 0;
  telemetry.engx = engineParts[0] ? engineParts[0].x : telemetry.comx;
  telemetry.off = engineParts.length ? Math.abs(telemetry.comx - telemetry.engx) : 0;
  telemetry.box = connectedParts.length
    ? [Math.min(...connectedParts.map(p => p.y)) - 30, Math.max(...connectedParts.map(p => p.y)) + 80]
    : [0, 0];

  telemetry.m0 = telemetry.dry + propellantMass;
  telemetry.dv = engineSpec.isp * DATA.constants.g0.value * Math.log(telemetry.m0 / telemetry.dry);
  telemetry.sun = telemetry.gen * DATA.solarFluxFactor[contract.dest].value * (1 - orbit.ecl);
  telemetry.ecH = orbit.ecl * orbit.per;
  telemetry.down = telemetry.mb * DATA.commsDistanceFactor[contract.dest].value * orbit.contact * 86.4;
  telemetry.days = Math.max(
    DATA.transitDaysBase[contract.dest].value * engineSpec.tf,
    engineSpec.dvDay ? (orbit.dv * 1000) / engineSpec.dvDay : 0
  );
  telemetry.life = DATA.constants.designLifeMonths.value * (orbit.rad && !busSpec.hard ? 0.6 : 1) - telemetry.days / 30;

  // Section 6.2 margin convention: margin = (capacity - predictedUse) / predictedUse
  const buildCheckRow = (name, category, used, capacity, unit, src, verified) => {
    const margin = used <= 0 ? 1 : capacity > 0 ? (capacity - used) / used : -1;
    const lesson = CONTENT.lessons[name];
    return {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      category,
      n: name,
      use: used,
      cap: capacity,
      u: unit,
      mg: margin,
      pass: margin >= 0,
      severity: margin < 0 ? 'critical' : margin < threshold ? 'warning' : 'info',
      why: lesson.why,
      fix: lesson.fix,
      src,
      verified
    };
  };

  const requiredContactHours = telemetry.data
    ? (telemetry.mb ? telemetry.data / (telemetry.mb * DATA.commsDistanceFactor[contract.dest].value * 3.6) : 99)
    : 0;

  telemetry.rows = [
    buildCheckRow('Mass', 'mass', telemetry.m0, launcher.cap, 'kg', launcher.src, launcher.verified),
    buildCheckRow('Delta-v', 'launch', orbit.dv * 1000, telemetry.dv, 'm/s', orbit.src, orbit.verified),
    buildCheckRow('Power', 'power', telemetry.load, telemetry.sun, 'W', DATA.solarFluxFactor[contract.dest].src, false),
    buildCheckRow('Battery', 'power', telemetry.load * telemetry.ecH, telemetry.wh * DATA.constants.batteryDepthOfDischarge.value, 'Wh', DATA.constants.batteryDepthOfDischarge.src, false),
    buildCheckRow('Budget', 'budget', telemetry.cost, contract.cap, '$M', contract.src, contract.verified),
    buildCheckRow('Data storage', 'data', telemetry.data * (1 - orbit.contact), telemetry.gb, 'Gb', DATA.constants.baseStorageGb.src, false),
    buildCheckRow('Comms', 'comms', requiredContactHours, orbit.contact * 24, 'h/day', DATA.commsDistanceFactor[contract.dest].src, false),
    buildCheckRow('Time', 'time', contract.months, telemetry.life, 'months', DATA.constants.designLifeMonths.src, false)
  ];

  if (engineSpec.pw) {
    telemetry.rows.push(
      buildCheckRow('Ion power', 'power', engineSpec.pw, telemetry.gen, 'W', engineSpec.src, engineSpec.verified)
    );
  }

  const getRow = name => telemetry.rows.find(r => r.n === name);
  telemetry.g = getRow;

  const floatingCount = missionInput.parts.length - connectedParts.length;
  const isEngineValid = busPart && engineParts.length === 1 && engineParts[0].rot === 0 && engineParts[0].y > busPart.y;

  telemetry.checks = [
    {
      t: 'A spacecraft bus is the root of the ship',
      st: busPart ? 2 : 0,
      why: 'Everything must bolt onto the bus.',
      fix: 'Add a spacecraft bus from the Structure list.'
    },
    {
      t: 'Exactly one engine, nozzle down, below the bus',
      st: isEngineValid ? 2 : 0,
      why: 'Rockets must apply thrust axially from the aft stack.',
      fix: 'Attach one engine facing down beneath your fuel tanks.'
    },
    {
      t: 'Every part is attached',
      st: floatingCount ? 0 : 2,
      why: `${floatingCount} part(s) are unattached (highlighted red).`,
      fix: 'Drag unattached parts onto a glowing attachment node or delete them.'
    },
    {
      t: 'Balanced: thrust line through the center of mass',
      st: telemetry.off <= 14 ? 2 : telemetry.off <= 40 ? 1 : 0,
      why: `Center of mass is ${telemetry.off.toFixed(0)} px off the thrust line (tumbles above 40 px).`,
      fix: 'Mirror heavy parts symmetrically left and right of the centerline.'
    }
  ];

  const dataReturnRatio = telemetry.data
    ? Math.min(1, telemetry.down / telemetry.data) * (getRow('Data storage').mg < 0 ? telemetry.gb / (telemetry.data * (1 - orbit.contact)) : 1)
    : 0;

  telemetry.ret = dataReturnRatio;
  telemetry.sciF =
    telemetry.sci *
    orbit.res *
    dataReturnRatio *
    (Math.max(0, telemetry.life) / DATA.constants.designLifeMonths.value) *
    (getRow('Power').mg < 0 ? 0.5 : 1) *
    (getRow('Battery').mg < 0 ? 0.6 : 1);

  const hasHealthyMargin = name => getRow(name).mg >= threshold;
  const isPositiveMargin = name => getRow(name).mg >= 0;

  telemetry.sign = {
    Director: isPositiveMargin('Mass') && isPositiveMargin('Budget') && isPositiveMargin('Time'),
    Engineer:
      hasHealthyMargin('Delta-v') &&
      hasHealthyMargin('Power') &&
      hasHealthyMargin('Battery') &&
      (!engineSpec.pw || hasHealthyMargin('Ion power')) &&
      telemetry.checks[3].st === 2,
    Science: telemetry.sciF >= contract.target,
    Comms: hasHealthyMargin('Comms') && hasHealthyMargin('Data storage') && telemetry.data > 0
  };
  telemetry.signed = Object.values(telemetry.sign).every(Boolean);

  telemetry.revItems = [
    ...telemetry.rows.map(r => [r.n, r.mg < 0 ? 0 : r.mg < threshold ? 1 : 2]),
    ...telemetry.checks.map(c => [c.t, c.st]),
    ['Science vs threshold goal', telemetry.sciF >= contract.target ? 2 : telemetry.sciF >= contract.thr ? 1 : 0]
  ];

  const itemCount = telemetry.revItems.length;
  const countStatus = code => telemetry.revItems.filter(item => item[1] === code).length;
  telemetry.rev = {
    n: itemCount,
    g: countStatus(2),
    y: countStatus(1),
    r: countStatus(0),
    pct: countStatus(2) / itemCount,
    pass: countStatus(2) / itemCount >= DATA.reviewThreshold.v
  };

  let riskPenalty = Math.min(0.3, (telemetry.off / 40) * 0.2);
  telemetry.rows.forEach(r => {
    if (r.mg >= 0 && r.mg < threshold) {
      riskPenalty += (threshold - r.mg) * 0.8;
    }
  });

  telemetry.prob = Math.max(
    0.05,
    Math.min(0.99, launcher.rel * busSpec.rel - riskPenalty + (telemetry.signed ? 0.03 : 0) + (telemetry.rev.pass ? 0 : -0.08))
  );
  telemetry.bad = telemetry.checks.slice(0, 3).find(c => c.st === 0);

  return telemetry;
}

/**
 * Deterministic Monte Carlo simulation using seeded PRNG (Rule 8).
 */
export function runMonteCarloSimulation(telemetry, iterations = 100, seed = appState.mission.seed) {
  const rng = createSeededRng(seed);
  const outcomes = [0, 0, 0, 0];
  const contract = telemetry.C;

  for (let i = 0; i < iterations; i++) {
    const failedAscent =
      telemetry.off > 40 ||
      rng() > telemetry.prob ||
      telemetry.g('Delta-v').mg < 0 ||
      (telemetry.E.pw && telemetry.g('Ion power').mg < 0);

    if (failedAscent) {
      outcomes[0]++;
      continue;
    }

    const event = DATA.events[Math.floor(rng() * DATA.events.length)];
    const isImmune =
      event.imm === 'hard' ? telemetry.B.hard : event.imm === 'rec' ? telemetry.rec > 0 : telemetry.B.red;
    const finalScience = telemetry.sciF * (isImmune ? 1 : event.fa);

    if (finalScience >= contract.target) outcomes[3]++;
    else if (finalScience >= contract.thr) outcomes[2]++;
    else outcomes[1]++;
  }

  return outcomes;
}