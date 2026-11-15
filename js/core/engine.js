/* File: js/core/engine.js
 * Owner: Person A (Ashmin)
 * AI-assisted: YES — Gemini, 2026-11-14; Gemini, 2026-11-15; Claude, 2026-11-14; Claude, 2026-11-15 (two manual burns). Reviewed by a human: NO.
 * Sources used: NASA_CUBESAT101, JPL_CML
 */
import { DATA } from '../api/mockData.js';
import { CONTENT } from '../content.js';
import { getFeasibility } from './planets.js';
import { PART_DIMENSIONS, ATTACHMENT_NODES, MAX_PARTS, DEFAULT_SEED } from '../config.js';
import {
  appState,
  getNodeCategory,
  getDimensionKey,
  saveUndoSnapshot
} from './state.js';

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

/**
 * Builds the starter spacecraft centered at (480, 495) of the 960x1100 world canvas,
 * omitting the communications antenna so players attach one before launching.
 */
export function buildStarterSpacecraft() {
  appState.mission.parts = [];
  appState.mission.nu = 1;

  const centerX = 480;
  const bus = createPartInstance('bus_rad', centerX, 395);
  const tank = createPartInstance('tank', centerX, 515);
  const engine = createPartInstance('chem', centerX, 625);

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
  mountPart('bat', tank, 'R1');
}

export function buildFailingDemoSpacecraft() {
  appState.mission.ci = 2;
  appState.mission.oi = 0;
  appState.mission.L = 'medium';
  appState.mission.hard = 1;
  appState.mission.parts = [];
  appState.mission.nu = 1;

  const centerX = 480;
  const bus = createPartInstance('bus_std', centerX, 355);
  const tank1 = createPartInstance('tank', centerX, 475);
  const tank2 = createPartInstance('tank', centerX, 595);
  const engine = createPartInstance('chem', centerX, 705);

  attachParts(tank1, 'top', bus, 'bottom');
  attachParts(tank2, 'top', tank1, 'bottom');
  attachParts(engine, 'top', tank2, 'bottom');

  const radar = createPartInstance('i_radar', 0, 0);
  attachParts(radar, 'in', bus, 'R1');
}

/* ---- Developer Mode Prebuilt Reference Designs (3-Star Perfect Configurations) ---- */

export const DEVELOPER_PREBUILTS = [
  {
    id: 'dev_earth',
    contractId: 'earth',
    oi: 0,
    launcher: 'medium',
    hard: 1,
    title: 'Earth · Blue Sentinel (3★ Polar Mapper)',
    note: 'Balanced chemical orbiter with mirrored large solar wings, high-gain downlink, and full climate suite.',
    bus: 'bus_red',
    tanks: 1,
    engine: 'chem',
    ant: 'ant_hg',
    pairs: [['sol_l', 'bus', 1], ['bat', 'tank', 1], ['rec', 'tank', 2]],
    singles: [['i_cam', 'bus', 'R2'], ['i_spec', 'bus', 'L2']]
  },
  {
    id: 'dev_moon',
    contractId: 'moon',
    oi: 0,
    launcher: 'heavy',
    hard: 1,
    title: 'Moon · Selene Watch (3★ Lunar Surveyor)',
    note: '2-tank chemical transfer stack with mirrored solar wings, dual batteries, and mineral/ice instruments.',
    bus: 'bus_red',
    tanks: 2,
    engine: 'chem',
    ant: 'ant_hg',
    pairs: [['sol_l', 'bus', 1], ['bat', 0, 1], ['rec', 0, 2]],
    singles: [['i_spec', 'bus', 'R2'], ['i_therm', 'bus', 'L2']]
  },
  {
    id: 'dev_mars',
    contractId: 'mars',
    oi: 1,
    launcher: 'heavy',
    hard: 1,
    title: 'Mars · Red Survey (3★ Deep-Space Orbiter)',
    note: '3-tank chemical orbiter with 4x large solar wings for 0.43 AU flux, high-gain dish, and subsurface spectrometer.',
    bus: 'bus_red',
    tanks: 3,
    engine: 'chem',
    ant: 'ant_hg',
    pairs: [['sol_l', 'bus', 1], ['sol_l', 0, 1], ['bat', 1, 1], ['rec', 1, 2]],
    singles: [['i_spec', 'bus', 'R2'], ['i_cam', 'bus', 'L2']]
  },
  {
    id: 'dev_mercury',
    contractId: 'mercury',
    oi: 1,
    launcher: 'super',
    hard: 1,
    title: 'Mercury · Hot Rock (3★ Nuclear Thermal)',
    note: 'High-Isp nuclear thermal stage delivering >14 km/s delta-v for Mercury insertion with redundant avionics.',
    bus: 'bus_red',
    tanks: 3,
    engine: 'nuclear',
    ant: 'ant_hg',
    pairs: [['sol_s', 'bus', 1], ['bat', 0, 1], ['rec', 0, 2]],
    singles: [['i_spec', 'bus', 'R2'], ['i_therm', 'bus', 1, 'L2']]
  },
  {
    id: 'dev_venus',
    contractId: 'venus',
    oi: 1,
    launcher: 'heavy',
    hard: 1,
    title: 'Venus · Veiled Sister (3★ Cloud Penetrator)',
    note: '3-tank chemical orbiter with mirrored solar arrays, recorder, and spectrometer + thermal imager.',
    bus: 'bus_red',
    tanks: 3,
    engine: 'chem',
    ant: 'ant_hg',
    pairs: [['sol_l', 'bus', 1], ['bat', 0, 1], ['rec', 0, 2]],
    singles: [['i_spec', 'bus', 'R2'], ['i_therm', 'bus', 'L2']]
  },
  {
    id: 'dev_jupiter',
    contractId: 'jupiter',
    oi: 2,
    launcher: 'heavy',
    hard: 1,
    title: 'Jupiter · King’s Gamble (3★ RTG Nuclear)',
    note: 'Twin RTGs + nuclear thermal engine to conquer 3.7% sunlight and Jovian radiation belts.',
    bus: 'bus_red',
    tanks: 2,
    engine: 'nuclear',
    ant: 'ant_hg',
    pairs: [['rtg', 'bus', 1], ['rtg', 0, 1], ['bat', 0, 2], ['rec', 1, 1]],
    singles: [['i_spec', 'bus', 'R2'], ['i_mag', 'bus', 'L2']]
  },
  {
    id: 'dev_saturn',
    contractId: 'saturn',
    oi: 2,
    launcher: 'heavy',
    hard: 1,
    title: 'Saturn · Ring Lord (3★ Cassini-Class)',
    note: 'Nuclear thermal propulsion with quadruple RTGs for 1.1% solar flux and high-gain DSN downlink.',
    bus: 'bus_red',
    tanks: 2,
    engine: 'nuclear',
    ant: 'ant_hg',
    pairs: [['rtg', 'bus', 1], ['rtg', 0, 1], ['bat', 0, 2], ['rec', 1, 1]],
    singles: [['i_spec', 'bus', 'R2'], ['i_mag', 'bus', 'L2']]
  },
  {
    id: 'dev_uranus',
    contractId: 'uranus',
    oi: 2,
    launcher: 'super',
    hard: 1,
    title: 'Uranus · Sideways World (3★ Ice Giant Probe)',
    note: '3-tank nuclear stage with quadruple RTGs, low-data spectrometer + magnetometer for 1.8% DSN rate.',
    bus: 'bus_red',
    tanks: 3,
    engine: 'nuclear',
    ant: 'ant_hg',
    pairs: [['rtg', 'bus', 1], ['rtg', 0, 1], ['bat', 0, 2], ['rec', 1, 1]],
    singles: [['i_spec', 'bus', 'R2'], ['i_mag', 'bus', 'L2']]
  },
  {
    id: 'dev_neptune',
    contractId: 'neptune',
    oi: 2,
    launcher: 'super',
    hard: 1,
    title: 'Neptune · Edge of the Map (3★ Deepest Orbit)',
    note: '4-tank nuclear thermal flagship with quadruple RTGs and ultra-lean telemetry for 0.012x DSN comms.',
    bus: 'bus_red',
    tanks: 4,
    engine: 'nuclear',
    ant: 'ant_hg',
    pairs: [['rtg', 'bus', 1], ['rtg', 0, 1], ['bat', 0, 2], ['rec', 1, 1]],
    singles: [['i_spec', 'bus', 'R2'], ['i_mag', 'bus', 'L2']]
  },
  {
    id: 'dev_sun',
    contractId: 'sun',
    oi: 1,
    launcher: 'super',
    hard: 0,
    title: 'The Sun · Solar Dive (Physics Demo)',
    note: 'Maximum-delta-v nuclear dive configuration to demonstrate why nothing survives solar entry.',
    bus: 'bus_red',
    tanks: 4,
    engine: 'nuclear',
    ant: 'ant_hg',
    pairs: [['sol_s', 'bus', 1], ['bat', 0, 1]],
    singles: [['i_spec', 'bus', 'R2'], ['i_mag', 'bus', 'L2']]
  }
];

export function buildDeveloperPrebuilt(prebuiltId) {
  const spec = DEVELOPER_PREBUILTS.find(p => p.id === prebuiltId);
  if (!spec) return null;

  const contractIndex = DATA.contracts.findIndex(c => c.id === spec.contractId);
  if (contractIndex === -1) return null;

  appState.mission.ci = contractIndex;
  appState.mission.oi = spec.oi;
  appState.mission.L = spec.launcher;
  appState.mission.hard = spec.hard;
  appState.mission.locked = false;
  appState.mission.parts = [];
  appState.mission.nu = 1;

  const centerX = 480;
  const bus = createPartInstance(spec.bus, centerX, 340);
  const tanks = [];
  let prevHost = bus;

  for (let i = 0; i < spec.tanks; i++) {
    const tank = createPartInstance('tank', centerX, 460 + i * 120);
    attachParts(tank, 'top', prevHost, 'bottom');
    tanks.push(tank);
    prevHost = tank;
  }

  const engine = createPartInstance(spec.engine, centerX, 460 + spec.tanks * 120);
  attachParts(engine, 'top', prevHost, 'bottom');

  if (spec.ant) {
    const ant = createPartInstance(spec.ant, 0, 0);
    attachParts(ant, 'base', bus, 'top');
  }

  const resolveHost = ref => (ref === 'bus' ? bus : tanks[ref] || bus);

  (spec.pairs || []).forEach(([partId, hostRef, tier]) => {
    const host = resolveHost(hostRef);
    const rightPart = createPartInstance(partId, 0, 0);
    attachParts(rightPart, 'in', host, `R${tier}`);
    const leftPart = createPartInstance(partId, 0, 0);
    attachParts(leftPart, 'in', host, `L${tier}`);
  });

  (spec.singles || []).forEach(([partId, hostRef, nodeName]) => {
    const host = resolveHost(hostRef);
    const part = createPartInstance(partId, 0, 0);
    attachParts(part, 'in', host, nodeName);
  });

  return spec;
}

export function autoAttachPart(partId) {
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
      createPartInstance(partId, 480, 395);
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
  const weather = appState.spaceWeather;

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
    rg: 0,
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
      if (spec.rtg) telemetry.rg += spec.gen || 0;
      else telemetry.gen += spec.gen || 0;
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
  telemetry.sun = telemetry.gen * DATA.solarFluxFactor[contract.dest].value * (1 - orbit.ecl) + telemetry.rg;
  telemetry.ecH = orbit.ecl * orbit.per;
  telemetry.down = telemetry.mb * DATA.commsDistanceFactor[contract.dest].value * orbit.contact * 86.4;
  telemetry.days = Math.max(
    DATA.transitDaysBase[contract.dest].value * engineSpec.tf,
    engineSpec.dvDay ? (orbit.dv * 1000) / engineSpec.dvDay : 0
  );

  const radWear = orbit.rad && !busSpec.hard
    ? Math.max(0.5, 0.65 / (weather?.radiationMultiplier || 1))
    : orbit.rad > 1
      ? 0.75
      : 1;
  telemetry.baseLife = contract.life || DATA.constants.designLifeMonths.value;
  telemetry.life = telemetry.baseLife * radWear - telemetry.days / 30;

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
    buildCheckRow('Time', 'time', contract.months, telemetry.life, 'months', weather?.isLive ? weather.src : DATA.constants.designLifeMonths.src, weather?.isLive || false)
  ];

  if (engineSpec.pw) {
    telemetry.rows.push(
      buildCheckRow('Ion power', 'power', engineSpec.pw, telemetry.gen + telemetry.rg, 'W', engineSpec.src, engineSpec.verified)
    );
  }

  const getRow = name => telemetry.rows.find(r => r.n === name);
  telemetry.g = getRow;

  const flightModel = DATA.flightModel;
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
      st: telemetry.off <= flightModel.balanceGoodPx ? 2 : telemetry.off <= flightModel.balanceLimitPx ? 1 : 0,
      why: `Center of mass is ${telemetry.off.toFixed(0)} px off the thrust line (tumbles above ${flightModel.balanceLimitPx} px).`,
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
    (Math.max(0, telemetry.life) / telemetry.baseLife) *
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

  const marginPenalty = telemetry.rows.reduce(
    (sum, r) => (r.mg >= 0 && r.mg < threshold ? sum + (threshold - r.mg) * flightModel.amberPenaltyFactor : sum),
    0
  );
  const balancePenalty = Math.min(
    flightModel.balancePenaltyAtLimit,
    (telemetry.off / flightModel.balanceLimitPx) * flightModel.balancePenaltyAtLimit
  );
  const signOffBonus = telemetry.signed ? flightModel.signOffBonus : 0;
  const reviewPenalty = telemetry.rev.pass ? 0 : flightModel.reviewFailPenalty;
  const baseReliability = launcher.rel * busSpec.rel;
  const adjustment = -marginPenalty - balancePenalty + signOffBonus - reviewPenalty;

  telemetry.reliabilityParts = { launcher: launcher.rel, bus: busSpec.rel, adjustment };
  telemetry.reliability = Math.max(
    flightModel.reliabilityMin,
    Math.min(flightModel.reliabilityMax, baseReliability + adjustment)
  );
  telemetry.bad = telemetry.checks.slice(0, 3).find(c => c.st === 0);

  return telemetry;
}

/* ---- Deterministic Flight Resolution & Present-Day Events ---- */

export function fillTemplate(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key];
    if (typeof value !== 'number') return value === undefined ? match : String(value);
    return key.endsWith('Pct') ? String(Math.round(value * 100)) : Math.round(value).toLocaleString();
  });
}

function doesEventTrigger(event, telemetry) {
  const { trigger } = event;
  if (trigger.dest !== undefined) return telemetry.C.dest === trigger.dest;
  if (trigger.minTransitDays !== undefined) return telemetry.days >= trigger.minTransitDays;
  const value = telemetry.O[trigger.orbitField];
  if (trigger.gte !== undefined && value < trigger.gte) return false;
  if (trigger.lte !== undefined && value > trigger.lte) return false;
  return true;
}

function isEventImmune(event, telemetry) {
  if (event.imm === 'hard') return !!telemetry.B.hard;
  if (event.imm === 'rec') return telemetry.rec > 0;
  return !!telemetry.B.red;
}

export function getTriggeredEvents(telemetry) {
  const weather = appState.spaceWeather;
  return DATA.events
    .filter(event => doesEventTrigger(event, telemetry))
    .map(event => {
      const immune = isEventImmune(event, telemetry);
      let factor = event.scienceFactor;
      if (!immune && event.id === 'solar_flare' && weather?.radiationMultiplier > 1) {
        factor = Math.max(0.65, +(event.scienceFactor / weather.radiationMultiplier).toFixed(2));
      }
      return {
        id: event.id,
        immune,
        scienceFactor: immune ? 1 : factor
      };
    });
}

export function scoreFlight(telemetry, outcome, science) {
  const weights = DATA.scoringWeights;
  const contract = telemetry.C;

  let stars = outcome === 'lost' ? 0 : 1;
  if (science >= contract.target) stars = 2;
  if (stars === 2 && telemetry.signed && telemetry.cost <= contract.cap * weights.threeStarBudgetFraction) stars = 3;

  const score = outcome === 'lost'
    ? 0
    : Math.round(
        (science * weights.scienceMultiplier +
          (contract.cap - telemetry.cost) * weights.budgetSavingsMultiplier +
          stars * weights.starBonus) *
          (telemetry.signed ? weights.fullSignOffMultiplier : 1) *
          telemetry.reliability
      );

  return { stars, score };
}

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

const BURN_ORDER = ['departure', 'insertion'];

function getBurnQuality(burns, kind) {
  return burns && burns[kind] ? clamp01(burns[kind].quality) : null;
}

export function scoreBurn(fill, kind = 'departure') {
  const model = DATA.flightModel;
  const spec = model.burns[kind];
  const clamped = clamp01(fill);
  if (!spec) return { kind, fill: clamped, quality: 0, bonus: 0 };
  const quality = clamp01(1 - Math.abs(clamped - spec.target) / spec.zoneHalfWidth);
  return { kind, fill: clamped, quality, bonus: quality * spec.weight * model.burnBonusMax };
}

export function resolveFlight(telemetry, burns = null) {
  const model = DATA.flightModel;
  const contract = telemetry.C;
  const steps = [];

  const finish = (outcome, science, events, reasons) => ({
    outcome,
    science,
    events,
    reasons,
    steps,
    reliability: telemetry.reliability,
    ...scoreFlight(telemetry, outcome, science)
  });

  const lose = (key, values, reasonKey) => {
    steps.push({ key, ok: false, fatal: true, values });
    const reason = CONTENT.flightFailures[reasonKey];
    return finish('lost', 0, [], [`${reason.why} Fix: ${reason.fix}`]);
  };

  const deltaV = telemetry.g('Delta-v');

  steps.push({
    key: 'liftoff',
    ok: true,
    values: { launcher: telemetry.L.n, massKg: telemetry.m0, reliabilityPct: telemetry.reliability }
  });

  if (telemetry.off > model.balanceLimitPx) {
    return lose('tumble', { offPx: telemetry.off, limitPx: model.balanceLimitPx }, 'tumble');
  }
  steps.push({ key: 'ascent', ok: true, values: { reliabilityPct: telemetry.reliability } });

  const feasibility = getFeasibility(contract);
  steps.push({
    key: 'feasibility',
    ok: true,
    values: {
      name: contract.n,
      cls: feasibility.cls,
      label: feasibility.lab,
      notes: feasibility.notes.join('; '),
      haveMs: telemetry.dv,
      needMs: deltaV.use,
      haveW: telemetry.sun,
      needW: telemetry.load,
      days: telemetry.days
    }
  });

  if (contract.doom) {
    CONTENT.sunDive.lines.forEach(([text, cls]) => {
      steps.push({ key: 'sun_dive', ok: cls !== 'bad', values: { text } });
    });
    steps.push({ key: 'sun_boom', ok: false, fatal: true, values: { text: CONTENT.sunDive.boom } });
    const sunReasons = CONTENT.sunDive.why.map((line, index) =>
      index === 0 ? `${line} Your craft had ${Math.round(telemetry.dv).toLocaleString()} m/s.` : line
    );
    return finish('lost', 0, [], sunReasons);
  }

  steps.push({ key: 'transfer', ok: deltaV.mg >= 0, values: { needMs: deltaV.use, haveMs: telemetry.dv } });
  if (deltaV.mg < 0) {
    return lose('deltav_short', { shortMs: deltaV.use - telemetry.dv }, 'deltav');
  }
  if (telemetry.E.pw && telemetry.g('Ion power').mg < 0) {
    return lose('ion_short', { needW: telemetry.E.pw }, 'ion');
  }

  const burnShare = kind => {
    const quality = getBurnQuality(burns, kind);
    return quality === null ? 0 : quality * model.burns[kind].weight * model.burnBonusMax;
  };
  const burnBonus = Math.min(model.burnBonusMax, BURN_ORDER.reduce((total, kind) => total + burnShare(kind), 0));
  const pushBurnStep = kind => {
    const quality = getBurnQuality(burns, kind);
    if (quality === null) return;
    steps.push({
      key: quality > 0 ? `burn_${kind}` : `burn_${kind}_miss`,
      ok: true,
      values: { precisionPct: quality, bonusPct: burnShare(kind) }
    });
  };

  pushBurnStep('departure');
  steps.push({ key: 'arrival', ok: true, values: { days: telemetry.days, orbit: telemetry.O.n.toLowerCase() } });
  pushBurnStep('insertion');
  steps.push({ key: 'briefing', ok: true, values: { contractId: contract.id } });

  const events = getTriggeredEvents(telemetry);
  events.forEach(event => {
    steps.push({
      key: 'event',
      ok: event.immune,
      values: {
        eventId: event.id,
        scienceFactor: event.scienceFactor,
        flareClass: appState.spaceWeather?.flareClass || 'M1.4'
      }
    });
  });

  const science = events.reduce((total, event) => total * event.scienceFactor, telemetry.sciF) * (1 + burnBonus);
  steps.push({
    key: 'operations',
    ok: true,
    values: { returnedPct: telemetry.ret, science, target: contract.target }
  });

  const outcome = science >= contract.target ? 'success' : science > 0 ? 'partial' : 'lost';

  const reasons = telemetry.rows
    .filter(r => r.mg < appState.marginThreshold)
    .map(r => `${r.n}: ${r.why} Fix: ${r.fix} [${r.src}]`);

  if (telemetry.ret < 1 && telemetry.data) {
    reasons.push(fillTemplate(CONTENT.flightFailures.dataReturn, { returnedPct: telemetry.ret }));
  }

  events.filter(event => !event.immune).forEach(event => {
    const text = CONTENT.eventText[event.id];
    reasons.push(`${text.n}: ${text.hitT} ${fillTemplate(CONTENT.flightFailures.eventLoss, { lossPct: 1 - event.scienceFactor })} Fix: ${text.fix}`);
  });

  if (BURN_ORDER.every(kind => getBurnQuality(burns, kind) === null)) {
    reasons.push(fillTemplate(CONTENT.flightFailures.burnAuto, { maxBonusPct: model.burnBonusMax }));
  } else {
    BURN_ORDER.forEach(kind => {
      const quality = getBurnQuality(burns, kind);
      const name = CONTENT.burn[kind].name;
      if (quality === null) {
        reasons.push(fillTemplate(CONTENT.flightFailures.burnSkipped, { name }));
      } else if (quality > 0) {
        reasons.push(fillTemplate(CONTENT.flightFailures.burn, { name, precisionPct: quality, bonusPct: burnShare(kind) }));
      } else {
        reasons.push(fillTemplate(CONTENT.flightFailures.burnMiss, { name }));
      }
    });
  }

  const reliabilityLine = fillTemplate(CONTENT.flightFailures.reliability, {
    reliabilityPct: telemetry.reliability,
    launcherPct: telemetry.reliabilityParts.launcher,
    busPct: telemetry.reliabilityParts.bus,
    adjustmentPct: telemetry.reliabilityParts.adjustment
  });
  reasons.push(reliabilityLine + (telemetry.reliabilityParts.adjustment < 0 ? CONTENT.flightFailures.reliabilityFix : ''));

  return finish(outcome, science, events, reasons);
}