/* File: js/core/planets.js
 * Owner: ported from the Apogee-temp-asmin feature branch (lib/planets.js, v3.2)
 * AI-assisted: YES — Claude, 2026-11-14. Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): Claude, 2026-11-15 - data import path updated for the renamed game-data module (js/api/gameData.js). Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted (update): ChatGPT, 2026-11-15 - source header aligned with the NASA Planetary, Moon and Sun fact sheets used by the briefings. Reviewed by a human: YES, Person C (Yochan).
 * Sources used: NASA NSSDCA Planetary Fact Sheet (Metric) and individual planet fact sheets; NASA Moon Fact Sheet; NASA Sun Fact Sheet (read 2026-11-15)
 */
import { DATA } from '../api/gameData.js';
import { CONTENT } from '../content.js';

/**
 * Best delta-v (km/s) the game lets you build: super-heavy launcher, hardened bus, as many tanks as fit.
 * Used only to label how hard a destination is before the player designs anything.
 */
const BEST_BUILDABLE_DV = (() => {
  const tank = DATA.tank;
  const bus = DATA.parts.bus_rad;
  const result = {};

  for (const key of ['chem', 'nuclear']) {
    const engine = DATA.engines[key];
    let best = 0;
    for (let tanks = 1; tanks <= 8; tanks++) {
      const dry = bus.m + engine.m + tanks * tank.dry + 250;
      const wet = dry + tanks * tank.prop;
      if (wet <= DATA.launchers.super.cap) {
        best = Math.max(best, engine.isp * DATA.constants.g0.value * Math.log(wet / dry));
      }
    }
    result[key] = best / 1000;
  }
  return result;
})();

/**
 * Rates a destination before design: Feasible, Hard, Extreme, Beyond current engines, or IMPOSSIBLE.
 * Returns { lab, cls, notes[], dv } where cls is a colour class (g / y / r).
 */
export function getFeasibility(contract) {
  if (contract.doom) {
    return { lab: 'IMPOSSIBLE', cls: 'r', notes: ['no spacecraft can survive it; try it and see why'], dv: Infinity };
  }

  const cheapestDv = Math.min(...contract.orbits.map(o => o.dv));
  const chemical = BEST_BUILDABLE_DV.chem;
  const nuclear = BEST_BUILDABLE_DV.nuclear;
  const sunlight = DATA.solarFluxFactor[contract.dest].value;
  const commsFactor = DATA.commsDistanceFactor[contract.dest].value;
  const tripDays = DATA.transitDaysBase[contract.dest].value;

  let lab;
  let cls;
  if (cheapestDv <= chemical * 0.65) { lab = 'Feasible'; cls = 'g'; }
  else if (cheapestDv <= chemical * 0.95) { lab = 'Hard: giant chemical rocket'; cls = 'y'; }
  else if (cheapestDv <= nuclear * 0.95) { lab = 'Extreme: needs nuclear engine'; cls = 'y'; }
  else { lab = 'Beyond current engines'; cls = 'r'; }

  const notes = [
    `needs at least ${cheapestDv.toFixed(1)} km/s of delta-v`,
    `trip about ${tripDays < 120 ? `${tripDays} days` : `${(tripDays / 365).toFixed(1)} years`} (chemical engine)`
  ];
  if (sunlight < 0.2) notes.push(`sunlight only ${(sunlight * 100).toFixed(1)}% of Earth’s: bring radioisotope generators`);
  else if (sunlight > 2.5) notes.push(`sunlight ${sunlight}x Earth’s: heat is the enemy`);
  if (commsFactor < 0.05) notes.push(`weak signal: only ${(commsFactor * 100).toFixed(1)}% of the data rate, choose light instruments`);

  return { lab, cls, notes, dv: cheapestDv };
}

/** Destination briefing (gravity, climate, moons...) as an HTML snippet. `welcome` adds a heading line. */
export function buildPlanetBriefing(contractId, welcome = false) {
  const info = CONTENT.planetInfo[contractId];
  if (!info) return '';
  const felt = Math.round(70 * info.gx);
  return `<span class="pin">${welcome ? `<b>Welcome to ${info.name}</b><br>` : ''}` +
    `<b>Gravity:</b> ${info.grav} m/s² (${info.gx}x Earth). A 70 kg person would feel like ${felt} kg${info.gnote ? ` (${info.gnote})` : ''}.<br>` +
    `<b>Environment:</b> ${info.env}<br>` +
    `<b>Temperature:</b> ${info.temp}<br>` +
    `<b>Atmosphere:</b> ${info.atm}<br>` +
    `<b>Day and year:</b> ${info.day}<br>` +
    `<b>Moons and rings:</b> ${info.moons}<br>` +
    `<b>Unique:</b> ${info.uniq}</span>`;
}
