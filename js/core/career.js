/* File: js/core/career.js
 * Owner: ported from the Apogee-temp-asmin feature branch (lib/career.js, v3.2)
 * AI-assisted: YES — Claude, 2026-11-14; Gemini, 2026-11-15. Reviewed by a human: YES Reviewd by Person C (Yochan)
 * Sources used: none (game design, not NASA data)
 */
import { DATA } from '../api/mockData.js';
import { CONTENT } from '../content.js';

export const HOME_IDS = ['earth', 'moon', 'mars'];

/* Engaging, paced unlock chain so players unlock new worlds steadily without tedious grinding */
export const GATES = [
  { id: 'venus', lv: 2, need: [['earth', 1], ['moon', 1]], title: 'Orbital Cadet' },
  { id: 'jupiter', lv: 4, need: [['mars', 1], ['venus', 1]], title: 'Deep-Space Navigator' },
  { id: 'saturn', lv: 6, need: [['jupiter', 1]], title: 'Ring Rider' },
  { id: 'uranus', lv: 8, need: [['saturn', 1, 1]], title: 'Ice Voyager' },
  { id: 'neptune', lv: 10, need: [['uranus', 1, 1]], title: 'Edge Walker' },
  { id: 'mercury', lv: 12, need: [['neptune', 1, 1]], title: 'Fire Walker' },
  { id: 'sun', lv: 14, need: [['mercury', 1, 1]], title: 'Master of the Solar System' }
];

const GRAND_TOUR = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const STORAGE_KEY = 'apogeeCareer';
const emptyCareer = () => ({ arr: {}, good: {}, lost: 0, tot: 0, un: [], ach: {}, streak: 0, dev: false });

let career = emptyCareer();
try {
  const parsed = JSON.parse(localStorage[STORAGE_KEY] || '{}');
  if (parsed && typeof parsed === 'object') {
    if ('god' in parsed && !('dev' in parsed)) {
      parsed.dev = !!parsed.god;
    }
    delete parsed.god;
    Object.assign(career, parsed);
  }
} catch {
  career = emptyCareer();
}

const saveCareer = () => {
  try {
    localStorage[STORAGE_KEY] = JSON.stringify(career);
  } catch {}
};

export const ACHIEVEMENTS = [
  { id: 'first', n: 'First Light', t: 'Make your first safe arrival.', test: x => x.ok },
  { id: 'star3', n: 'Flawless', t: 'Earn 3 stars on a mission.', test: x => x.st >= 3 },
  { id: 'thrift', n: 'Penny Pincher', t: 'Succeed while spending under 65% of the budget.', test: x => x.out === 'success' && x.d.cost <= x.C.cap * 0.65 },
  { id: 'home', n: 'Home Turf', t: 'Arrive safely at Earth, the Moon and Mars.', test: () => HOME_IDS.every(h => career.arr[h] > 0) },
  { id: 'nuke', n: 'Nuclear Option', t: 'Arrive safely using a nuclear thermal engine.', test: x => x.ok && x.d.E.patch === 'nuc' },
  { id: 'ion', n: 'Slow and Steady', t: 'Arrive safely using an ion engine.', test: x => x.ok && x.d.E.patch === 'ion' },
  { id: 'rtg', n: 'Atomic Battery', t: 'Arrive safely with a radioisotope generator aboard.', test: x => x.ok && x.rtg },
  { id: 'book', n: 'By the Book', t: 'Succeed under the NASA 35% margin policy.', test: x => x.out === 'success' && x.hard },
  { id: 'phoenix', n: 'Phoenix', t: 'Succeed right after losing a mission.', test: x => x.ok && x.wasLost },
  { id: 'learn', n: 'Learning the Hard Way', t: 'Lose 3 missions. Every engineer iterates.', test: () => career.lost >= 3 },
  { id: 'vet', n: 'Veteran', t: 'Make 8 safe arrivals.', test: () => career.tot >= 8 },
  { id: 'dir', n: 'Flight Director', t: 'Make 15 safe arrivals.', test: () => career.tot >= 15 },
  { id: 'tour', n: 'Grand Tour', t: 'Arrive safely at all eight planets.', test: () => GRAND_TOUR.every(h => career.arr[h] > 0) },
  { id: 'icarus', n: 'Icarus', t: 'Fly toward the Sun. It did not end well.', test: x => !!x.C.doom }
];

export const getCareer = () => career;
export const isDeveloperMode = () => !!career.dev;
export const isContractOpen = id => isDeveloperMode() || HOME_IDS.includes(id) || career.un.includes(id);

export function toggleDeveloperMode() {
  career.dev = !career.dev;
  saveCareer();
  return career.dev;
}

export const getContractSortKey = contract =>
  isContractOpen(contract.id) ? contract.ord : 100 + GATES.findIndex(g => g.id === contract.id);

export const getPlanetName = id => CONTENT.planetInfo[id].name.replace(/^the /, '');

const getTopGate = () => (isDeveloperMode() ? GATES[GATES.length - 1] : GATES.filter(g => career.un.includes(g.id)).pop());
export const getCareerLevel = () => (getTopGate() ? getTopGate().lv : 0);
export const getCareerRank = () => (isDeveloperMode() ? 'Developer Mode (All Maps)' : getTopGate() ? getTopGate().title : 'Launch Pad Rookie');
export const getNextGate = () => (isDeveloperMode() ? null : GATES.find(g => !career.un.includes(g.id)));
export const getCareerButtonLabel = () => `Career: Level ${getCareerLevel()} - ${getCareerRank()}`;

const countArrivals = (id, good) => (good ? career.good : career.arr)[id] || 0;

export const describeGateNeed = gate =>
  gate.need.map(([id, count, good]) => {
    const kind = good ? 'good' : 'safe';
    const plural = count > 1 ? 's' : '';
    const suffix = good ? ' (science above threshold)' : '';
    return `${count} ${kind} arrival${plural} at ${getPlanetName(id)}${suffix} (${Math.min(count, countArrivals(id, good))}/${count})`;
  }).join(', ');

export const getLockInfo = contract => {
  const gate = GATES.find(g => g.id === contract.id);
  return gate ? { level: gate.lv, need: describeGateNeed(gate) } : null;
};

export function recordMission({ out, C, d, st, rtg, sci, hard }) {
  const ok = out !== 'lost';
  const news = [];
  const wasLost = career.streak > 0;

  if (ok) {
    career.arr[C.id] = (career.arr[C.id] || 0) + 1;
    career.tot++;
    career.streak = 0;
    if ((sci || 0) >= C.thr) career.good[C.id] = (career.good[C.id] || 0) + 1;
  } else {
    career.lost++;
    career.streak++;
  }

  for (let changed = true; changed;) {
    changed = false;
    GATES.forEach(gate => {
      const met = gate.need.every(([id, count, good]) => countArrivals(id, good) >= count);
      if (!career.un.includes(gate.id) && met) {
        career.un.push(gate.id);
        news.push({ k: 'lv', lv: gate.lv, title: gate.title, planet: getPlanetName(gate.id) });
        changed = true;
      }
    });
  }

  const context = { ok, out, C, d, st, rtg, wasLost, hard: !!hard };
  ACHIEVEMENTS.forEach(a => {
    if (!career.ach[a.id] && a.test(context)) {
      career.ach[a.id] = 1;
      news.push({ k: 'ach', n: a.n, t: a.t });
    }
  });

  saveCareer();
  return news;
}

export function resetCareer() {
  career = emptyCareer();
  saveCareer();
}

export const getUngatedDestinations = () =>
  DATA.contracts.filter(c => !HOME_IDS.includes(c.id) && !GATES.some(g => g.id === c.id)).map(c => c.id);