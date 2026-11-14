/* File: js/core/career.js
 * Owner: ported from the Apogee-temp-asmin feature branch (lib/career.js, v3.2)
 * AI-assisted: YES — Claude, 2026-11-14. Reviewed by a human: NO.
 * Sources used: none (game design, not NASA data)
 */
import { DATA } from '../api/mockData.js';
import { CONTENT } from '../content.js';

/**
 * Career: planets unlock in a chain. Levels go up in steps of 2. A "safe arrival" is any mission that is not lost.
 * A "good arrival" is a safe arrival that also collected at least the threshold science (contract.thr).
 * `need` entries are [planet, count] for safe arrivals, or [planet, count, 1] for good arrivals.
 * The chain follows real difficulty (delta-v): Venus, Jupiter, Saturn, Uranus, Neptune, Mercury, Sun.
 * Progress is saved in localStorage (key apogeeCareer).
 */
export const HOME_IDS = ['earth', 'moon', 'mars'];

export const GATES = [
  { id: 'venus', lv: 2, need: [['earth', 1], ['moon', 1], ['mars', 1]], title: 'Orbital Cadet' },
  { id: 'jupiter', lv: 4, need: [['venus', 2]], title: 'Deep-Space Navigator' },
  { id: 'saturn', lv: 6, need: [['jupiter', 2]], title: 'Ring Rider' },
  { id: 'uranus', lv: 8, need: [['saturn', 2], ['saturn', 1, 1]], title: 'Ice Voyager' },
  { id: 'neptune', lv: 10, need: [['uranus', 2], ['uranus', 1, 1]], title: 'Edge Walker' },
  { id: 'mercury', lv: 12, need: [['neptune', 2], ['neptune', 1, 1]], title: 'Fire Walker' },
  { id: 'sun', lv: 14, need: [['mercury', 2], ['mercury', 1, 1]], title: 'Master of the Solar System' }
];

const GRAND_TOUR = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const STORAGE_KEY = 'apogeeCareer';
const emptyCareer = () => ({ arr: {}, good: {}, lost: 0, tot: 0, un: [], ach: {}, streak: 0 });

let career = emptyCareer();
try {
  Object.assign(career, JSON.parse(localStorage[STORAGE_KEY] || '{}'));
} catch {
  career = emptyCareer();
}

const saveCareer = () => {
  try {
    localStorage[STORAGE_KEY] = JSON.stringify(career);
  } catch {}
};

/** Achievements. `test(x)` receives { ok, out, C, d, st, rtg, wasLost, hard }. */
export const ACHIEVEMENTS = [
  { id: 'first', n: 'First Light', t: 'Make your first safe arrival.', test: x => x.ok },
  { id: 'star3', n: 'Flawless', t: 'Earn 3 stars on a mission.', test: x => x.st >= 3 },
  { id: 'thrift', n: 'Penny Pincher', t: 'Succeed while spending under 60% of the budget.', test: x => x.out === 'success' && x.d.cost <= x.C.cap * 0.6 },
  { id: 'home', n: 'Home Turf', t: 'Arrive safely at Earth, the Moon and Mars.', test: () => HOME_IDS.every(h => career.arr[h] > 0) },
  { id: 'nuke', n: 'Nuclear Option', t: 'Arrive safely using a nuclear thermal engine.', test: x => x.ok && x.d.E.patch === 'nuc' },
  { id: 'ion', n: 'Slow and Steady', t: 'Arrive safely using an ion engine.', test: x => x.ok && x.d.E.patch === 'ion' },
  { id: 'rtg', n: 'Atomic Battery', t: 'Arrive safely with a radioisotope generator aboard.', test: x => x.ok && x.rtg },
  { id: 'book', n: 'By the Book', t: 'Succeed under the NASA 35% margin policy.', test: x => x.out === 'success' && x.hard },
  { id: 'phoenix', n: 'Phoenix', t: 'Succeed right after losing a mission.', test: x => x.ok && x.wasLost },
  { id: 'learn', n: 'Learning the Hard Way', t: 'Lose 5 missions. Every engineer has.', test: () => career.lost >= 5 },
  { id: 'vet', n: 'Veteran', t: 'Make 10 safe arrivals.', test: () => career.tot >= 10 },
  { id: 'dir', n: 'Flight Director', t: 'Make 25 safe arrivals.', test: () => career.tot >= 25 },
  { id: 'tour', n: 'Grand Tour', t: 'Arrive safely at all eight planets.', test: () => GRAND_TOUR.every(h => career.arr[h] > 0) },
  { id: 'icarus', n: 'Icarus', t: 'Fly toward the Sun. It did not end well.', test: x => !!x.C.doom }
];

/* ---- Queries ---- */

export const getCareer = () => career;
export const isContractOpen = id => HOME_IDS.includes(id) || career.un.includes(id);

/** Unlocked planets sit in solar-system order; locked ones wait at the end in unlock order. */
export const getContractSortKey = contract =>
  isContractOpen(contract.id) ? contract.ord : 100 + GATES.findIndex(g => g.id === contract.id);

/** Planet name without a leading "the " (CONTENT.planetInfo holds the display name). */
export const getPlanetName = id => CONTENT.planetInfo[id].name.replace(/^the /, '');

const getTopGate = () => GATES.filter(g => career.un.includes(g.id)).pop();
export const getCareerLevel = () => (getTopGate() ? getTopGate().lv : 0);
export const getCareerRank = () => (getTopGate() ? getTopGate().title : 'Launch Pad Rookie');
export const getNextGate = () => GATES.find(g => !career.un.includes(g.id));
export const getCareerButtonLabel = () => `Career: Level ${getCareerLevel()} - ${getCareerRank()}`;

const countArrivals = (id, good) => (good ? career.good : career.arr)[id] || 0;

/** Human-readable requirement for one gate, with progress, e.g. "2 safe arrivals at Venus (1/2)". */
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

/* ---- Updates ---- */

/**
 * Records one finished mission, unlocks whatever it earned and returns the news to show in the debrief:
 * [{ k: 'lv', lv, title, planet } | { k: 'ach', n, t }].
 */
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

/** Used by tests and tooling: number of destinations that exist in DATA but have no unlock rule (should be 0). */
export const getUngatedDestinations = () =>
  DATA.contracts.filter(c => !HOME_IDS.includes(c.id) && !GATES.some(g => g.id === c.id)).map(c => c.id);
