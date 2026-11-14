/* File: js/api/mockData.js
 * Owner: Person A (Ashmin - structure), Person C (Yochan - values)
 * AI-assisted: YES — Gemini, 2026-11-14; Claude, 2026-11-14. Reviewed by a human: NO.
 * Sources used: NASA_CUBESAT101, JPL_CML, NASA_SE_WEBINAR
 * Career destinations (Mercury to Neptune, the Sun) and the radioisotope generator were ported from the
 * Apogee-temp-asmin feature branch; their values keep the same SIMPLIFIED_FOR_GAMEPLAY / UNVERIFIED_MEMORY tags.
 */

/**
 * Every numerical parameter carries `src` and `verified` per Section 5.1.
 * verified: true  -> explicitly documented in Appendix A sources.
 * verified: false -> SIMPLIFIED_FOR_GAMEPLAY or UNVERIFIED_MEMORY.
 */
export const DATA = {
  constants: {
    g0: {
      value: 9.80665,
      unit: 'm/s^2',
      src: 'Standard gravity constant (SI definition)',
      verified: true,
      note: 'Used in the Tsiolkovsky rocket equation.'
    },
    designLifeMonths: {
      value: 36,
      unit: 'months',
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Baseline spacecraft bus operational lifetime before radiation/wear degradation.'
    },
    batteryDepthOfDischarge: {
      value: 0.8,
      unit: 'fraction',
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Usable fraction of total battery energy capacity during orbital eclipse.'
    },
    baseStorageGb: {
      value: 30,
      unit: 'Gb',
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Built-in solid-state storage on the spacecraft bus.'
    },
    budgetReserveMin: {
      value: 0.1,
      unit: 'fraction',
      src: 'NASA_CUBESAT101 (p. 13)',
      verified: true,
      note: 'Budgets should include a reserve of at least 10%.'
    }
  },

  solarFluxFactor: {
    earth: { value: 1.0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Normalized solar irradiance at 1 AU.' },
    moon: { value: 1.0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Normalized solar irradiance at 1 AU.' },
    mars: { value: 0.43, src: 'UNVERIFIED_MEMORY', verified: false, note: 'Approximate solar flux ratio at Mars (~590 / 1361 W/m^2).' }
  },

  commsDistanceFactor: {
    earth: { value: 1.0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Baseline downlink efficiency in Earth orbit.' },
    moon: { value: 1.0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Normalized lunar downlink efficiency for gameplay.' },
    mars: { value: 0.1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Simplified deep-space downlink rate reduction (inverse-square attenuation).' }
  },

  transitDaysBase: {
    earth: { value: 0, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Direct insertion into Earth orbit.' },
    moon: { value: 5, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Typical lunar transfer duration.' },
    mars: { value: 210, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Simplified Hohmann-style Earth-to-Mars transit.' }
  },

  tank: {
    dry: 400,
    prop: 6000,
    c: 12,
    max: 6,
    src: 'SIMPLIFIED_FOR_GAMEPLAY',
    verified: false,
    note: 'Modular propellant tank dry mass (kg), propellant mass (kg), and cost ($M).'
  },

  launchers: {
    medium: {
      n: 'Medium launcher', cap: 9000, c: 90, rel: 0.95, img: 'launcher_medium',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative medium-lift LEO capacity (kg) and cost ($M).'
    },
    heavy: {
      n: 'Heavy launcher', cap: 26000, c: 200, rel: 0.97, img: 'launcher_heavy',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative heavy-lift LEO capacity (kg) and cost ($M).'
    },
    super: {
      n: 'Super-heavy launcher', cap: 50000, c: 420, rel: 0.92, img: 'launcher_super',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative super-heavy LEO capacity (kg) and cost ($M).'
    }
  },

  engines: {
    chem: {
      n: 'Chemical', isp: 380, m: 500, c: 30, tf: 1, pw: 0,
      img: 'engine_chemical', pl: 'plume_chemical', patch: 'chem',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'High-thrust bipropellant stage; lower specific impulse.'
    },
    nuclear: {
      n: 'Nuclear thermal', isp: 900, m: 3500, c: 150, tf: 0.8, pw: 0,
      img: 'engine_nuclear', pl: 'plume_nuclear', patch: 'nuc',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'High specific impulse thermal propulsion; heavy reactor mass.'
    },
    ion: {
      n: 'Ion', isp: 3000, m: 400, c: 60, tf: 1, pw: 1500, dvDay: 15,
      img: 'engine_ion', pl: 'plume_ion', patch: 'ion',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'Very high specific impulse electric propulsion; requires 1500 W continuous power.'
    }
  },

  parts: {
    bus_std: { g: 'bus', n: 'Standard bus', m: 450, pw: 200, c: 25, rel: 0.96, hard: 0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bus_rad: { g: 'bus', n: 'Hardened bus', m: 620, pw: 230, c: 45, rel: 0.97, hard: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bus_red: { g: 'bus', n: 'Hardened + backup computer', m: 780, pw: 260, c: 70, rel: 0.99, hard: 1, red: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    sol_s: { g: 'pow', n: 'Small solar wing', m: 60, gen: 500, c: 4, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    sol_l: { g: 'pow', n: 'Large solar wing', m: 140, gen: 1100, c: 9, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bat: { g: 'pow', n: 'Battery', m: 45, wh: 600, c: 3, max: 4, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    rtg: { g: 'pow', n: 'Radioisotope generator', m: 56, gen: 300, rtg: 1, c: 40, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Heat-powered. Output does not depend on sunlight, so it works far from the Sun.' },
    ant_lg: { g: 'com', n: 'Low-gain antenna', m: 8, pw: 20, mb: 5, c: 2, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    ant_mg: { g: 'com', n: 'Medium-gain antenna', m: 20, pw: 60, mb: 25, c: 5, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    ant_hg: { g: 'com', n: 'High-gain dish', m: 45, pw: 120, mb: 100, c: 12, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    rec: { g: 'com', n: 'Data recorder', m: 12, pw: 5, gb: 150, c: 3, max: 2, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_cam: { g: 'sci', n: 'Camera', m: 40, pw: 60, c: 20, data: 60, sci: 30, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_therm: { g: 'sci', n: 'Thermal imager', m: 35, pw: 45, c: 25, data: 25, sci: 25, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_spec: { g: 'sci', n: 'Spectrometer', m: 55, pw: 70, c: 35, data: 15, sci: 40, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_radar: { g: 'sci', n: 'Radar sounder', m: 90, pw: 250, c: 60, data: 120, sci: 60, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_mag: { g: 'sci', n: 'Magnetometer', m: 15, pw: 15, c: 10, data: 1, sci: 12, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
  },

  contracts: [
    {
      id: 'earth', months: 24, n: 'Blue Sentinel', dest: 'earth', target: 70, cap: 300,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low polar orbit', dv: 0.4, ecl: 0.35, per: 1.6, contact: 0.12, res: 1.0, rad: 0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Medium orbit', dv: 2.2, ecl: 0.2, per: 12, contact: 0.3, res: 0.6, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Geostationary', dv: 4.2, ecl: 0.01, per: 24, contact: 1.0, res: 0.35, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
      ]
    },
    {
      id: 'moon', months: 24, n: 'Selene Watch', dest: 'moon', target: 55, cap: 360,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low polar orbit', dv: 4.0, ecl: 0.4, per: 2, contact: 0.5, res: 1.0, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Elliptical orbit', dv: 3.9, ecl: 0.2, per: 12, contact: 0.7, res: 0.6, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Halo-type orbit', dv: 3.5, ecl: 0.02, per: 150, contact: 0.95, res: 0.3, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
      ]
    },
    {
      id: 'mars', months: 24, n: 'Red Survey', dest: 'mars', target: 80, cap: 650,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low orbit', dv: 5.6, ecl: 0.4, per: 2, contact: 0.5, res: 1.0, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Elliptical orbit', dv: 4.8, ecl: 0.2, per: 12, contact: 0.6, res: 0.6, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'High orbit', dv: 4.5, ecl: 0.1, per: 30, contact: 0.8, res: 0.3, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
      ]
    }
  ],

  marginPolicies: {
    easy: {
      v: 0.1,
      verified: true,
      src: 'NASA_CUBESAT101 (p. 13): projects should carry at least 10% reserves.'
    },
    hard: {
      v: 0.35,
      verified: true,
      src: 'JPL_CML (§V, Fig. 8b): CML 4 checklist requires 35% margin on dry mass, power, and energy.'
    }
  },

  reviewThreshold: {
    v: 0.8,
    verified: true,
    src: 'JPL_CML (§V): a concept counts as mature when at least 80% of checklist items are complete.'
  },

  /**
   * Launch reliability and balance limits. Reliability is NOT a dice roll: it is a visible
   * multiplier on the final score (see engine.js resolveFlight).
   * reliability = launcher.rel x bus.rel - amber penalties - balance penalty
   *               + sign-off bonus - failed-review penalty, kept between min and max.
   */
  flightModel: {
    balanceGoodPx: 14,
    balanceLimitPx: 40,
    balancePenaltyAtLimit: 0.2,
    amberPenaltyFactor: 0.8,
    signOffBonus: 0.03,
    reviewFailPenalty: 0.08,
    reliabilityMin: 0.05,
    reliabilityMax: 0.99,
    src: 'SIMPLIFIED_FOR_GAMEPLAY',
    verified: false,
    note: 'Gameplay constants. Balance limits are in screen pixels between centre of mass and thrust line.'
  },

  scoringWeights: {
    scienceMultiplier: 10,
    budgetSavingsMultiplier: 0.5,
    starBonus: 100,
    fullSignOffMultiplier: 1.1,
    threeStarBudgetFraction: 0.85,
    src: 'SIMPLIFIED_FOR_GAMEPLAY',
    verified: false
  },

  /**
   * Deterministic flight events. An event happens whenever its `trigger` matches the chosen
   * contract/orbit. It is skipped if the matching immunity part is on board (`imm`).
   * Otherwise science is multiplied by `scienceFactor`. No dice are rolled.
   *   trigger.dest       -> contract destination must match
   *   trigger.orbitField -> orbit field (rad, contact...) compared with gte / lte
   */
  events: [
    {
      id: 'solar_flare',
      imm: 'hard',
      scienceFactor: 0.8,
      trigger: { orbitField: 'rad', gte: 1 },
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Happens in radiation orbits. Immune with a hardened bus.'
    },
    {
      id: 'ground_outage',
      imm: 'rec',
      scienceFactor: 0.85,
      trigger: { orbitField: 'contact', lte: 0.5 },
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Happens when ground contact is half a day or less. Immune with a data recorder.'
    },
    {
      id: 'computer_glitch',
      imm: 'red',
      scienceFactor: 0.75,
      trigger: { dest: 'mars' },
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Happens on Mars missions, far from help. Immune with a backup computer.'
    }
  ],

  realMissions: [
    { dest: 'earth', n: 'Terra', yr: 1999, ins: ['i_cam', 'i_therm', 'i_spec'], oi: 0, verified: false, src: 'UNVERIFIED_MEMORY' },
    { dest: 'earth', n: 'ICESat-2', yr: 2018, ins: ['i_radar'], oi: 0, verified: false, src: 'UNVERIFIED_MEMORY' },
    { dest: 'earth', n: 'GOES-R series', yr: 2016, ins: ['i_cam', 'i_therm'], oi: 2, verified: false, src: 'UNVERIFIED_MEMORY' },
    { dest: 'moon', n: 'Lunar Reconnaissance Orbiter', yr: 2009, ins: ['i_cam', 'i_therm', 'i_radar', 'i_spec'], oi: 0, verified: false, src: 'UNVERIFIED_MEMORY' },
    { dest: 'moon', n: 'Lunar Prospector', yr: 1998, ins: ['i_spec', 'i_mag'], oi: 0, verified: false, src: 'UNVERIFIED_MEMORY' },
    { dest: 'moon', n: 'ARTEMIS', yr: 2011, ins: ['i_mag'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' },
    { dest: 'mars', n: 'Mars Reconnaissance Orbiter', yr: 2006, ins: ['i_cam', 'i_spec', 'i_radar'], oi: 0, verified: false, src: 'UNVERIFIED_MEMORY' },
    { dest: 'mars', n: 'Mars Odyssey', yr: 2001, ins: ['i_therm', 'i_spec'], oi: 0, verified: false, src: 'UNVERIFIED_MEMORY' },
    { dest: 'mars', n: 'MAVEN', yr: 2014, ins: ['i_mag', 'i_spec'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' }
  ]
};

const OBJECTIVES_BY_MISSION = {
  earth: [
    { n: 'Clouds and aerosols', ins: ['i_cam', 'i_spec'] },
    { n: 'Surface and ocean heat', ins: ['i_therm'] },
    { n: 'Ice sheet thickness', ins: ['i_radar'] }
  ],
  moon: [
    { n: 'Surface minerals', ins: ['i_spec', 'i_cam'] },
    { n: 'Buried water ice', ins: ['i_radar', 'i_therm'] },
    { n: 'Magnetic anomalies', ins: ['i_mag'] }
  ],
  mars: [
    { n: 'Surface geology maps', ins: ['i_cam', 'i_therm'] },
    { n: 'Subsurface water', ins: ['i_radar', 'i_spec'] },
    { n: 'Magnetic field remnants', ins: ['i_mag'] }
  ],
  mercury: [
    { n: 'Surface composition', ins: ['i_spec', 'i_cam'] },
    { n: 'Ice in shadowed polar craters', ins: ['i_radar', 'i_therm'] },
    { n: 'Magnetic field', ins: ['i_mag'] }
  ],
  venus: [
    { n: 'Cloud and atmosphere chemistry', ins: ['i_spec', 'i_cam'] },
    { n: 'Surface mapped through the clouds', ins: ['i_radar'] },
    { n: 'Heat and volcanism', ins: ['i_therm'] }
  ],
  jupiter: [
    { n: 'Cloud and storm imaging', ins: ['i_cam', 'i_spec'] },
    { n: 'Atmospheric heat', ins: ['i_therm'] },
    { n: 'Giant magnetic field', ins: ['i_mag'] }
  ],
  saturn: [
    { n: 'Rings and moons imaging', ins: ['i_cam', 'i_spec'] },
    { n: 'Atmospheric heat', ins: ['i_therm'] },
    { n: 'Magnetic field', ins: ['i_mag'] }
  ],
  uranus: [
    { n: 'Atmosphere and cloud imaging', ins: ['i_cam', 'i_spec'] },
    { n: 'Heat balance', ins: ['i_therm'] },
    { n: 'Odd magnetic field', ins: ['i_mag'] }
  ],
  neptune: [
    { n: 'Storm imaging', ins: ['i_cam', 'i_spec'] },
    { n: 'Heat balance', ins: ['i_therm'] },
    { n: 'Magnetic field', ins: ['i_mag'] }
  ],
  sun: [
    { n: 'Corona sampling', ins: ['i_spec', 'i_mag'] },
    { n: 'Solar surface imaging', ins: ['i_cam'] }
  ]
};

/* ---- Career-mode destinations (ported from the Apogee-temp-asmin feature branch, v3.2) ----
 * Appended AFTER the three original contracts, so contract indices 0-2 (Earth, Moon, Mars), saved
 * candidates and shared design codes keep working. `ord` is the solar-system display order.
 * `life` is the design life in months for that destination (falls back to constants.designLifeMonths).
 * Far planets need more than the default life because the trip alone takes years. */
const GAMEPLAY = { src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false };
const recalled = note => ({ src: 'UNVERIFIED_MEMORY', verified: false, note });

const makeOrbit = (n, dv, ecl, per, contact, res, rad) => ({ n, dv, ecl, per, contact, res, rad, ...GAMEPLAY });
const makeDestination = (id, ord, n, target, cap, life, orbits, extra = {}) => ({
  id, months: 24, n, dest: id, target, cap, ord, life, orbits, ...GAMEPLAY, ...extra
});

const CONTRACT_ORDER = { earth: 3, moon: 3.5, mars: 4 };
DATA.contracts.forEach(contract => { contract.ord = CONTRACT_ORDER[contract.id]; });

DATA.contracts.push(
  makeDestination('mercury', 1, 'Hot Rock', 70, 1200, 60, [
    makeOrbit('Low polar orbit', 13.4, 0.3, 2.3, 0.4, 1.0, 2),
    makeOrbit('Elliptical orbit (12 h)', 12.6, 0.1, 12, 0.6, 0.6, 2),
    makeOrbit('High orbit', 11.8, 0.03, 24, 0.8, 0.3, 2)
  ]),
  makeDestination('venus', 2, 'Veiled Sister', 75, 850, 48, [
    makeOrbit('Low polar orbit', 6.4, 0.35, 2.2, 0.5, 1.0, 1),
    makeOrbit('Elliptical orbit', 5.3, 0.1, 24, 0.6, 0.6, 1),
    makeOrbit('High orbit', 4.9, 0.05, 48, 0.8, 0.3, 1)
  ]),
  makeDestination('jupiter', 5, 'King’s Gamble', 30, 1000, 96, [
    makeOrbit('Polar elliptical orbit (Juno-like)', 7.6, 0.03, 100, 0.5, 1.0, 2),
    makeOrbit('Wide orbit among the moons', 7.2, 0.02, 150, 0.6, 0.6, 2),
    makeOrbit('Distant capture orbit', 6.9, 0.01, 200, 0.8, 0.3, 1)
  ]),
  makeDestination('saturn', 6, 'Ring Lord', 34, 1000, 168, [
    makeOrbit('Ring-grazing polar orbit', 8.6, 0.02, 100, 0.5, 1.0, 1),
    makeOrbit('Titan-tour orbit', 8.2, 0.02, 150, 0.6, 0.6, 1),
    makeOrbit('Distant orbit', 7.9, 0.01, 200, 0.8, 0.3, 1)
  ]),
  makeDestination('uranus', 7, 'Sideways World', 22, 1100, 276, [
    makeOrbit('Polar orbit', 9.9, 0.02, 100, 0.5, 1.0, 1),
    makeOrbit('Moon-tour orbit', 9.5, 0.02, 150, 0.6, 0.6, 1),
    makeOrbit('Distant orbit', 9.1, 0.01, 200, 0.8, 0.3, 1)
  ]),
  makeDestination('neptune', 8, 'Edge of the Map', 22, 1200, 336, [
    makeOrbit('Polar orbit', 10.6, 0.02, 100, 0.5, 1.0, 1),
    makeOrbit('Triton-tour orbit', 10.3, 0.02, 150, 0.6, 0.6, 1),
    makeOrbit('Distant orbit', 10.0, 0.01, 200, 0.8, 0.3, 1)
  ]),
  // The Sun cannot be completed: doom = true makes resolveFlight play the dive sequence (see content.js sunDive).
  makeDestination('sun', 10, 'Solar Dive', 50, 1000, 48, [
    makeOrbit('Straight plunge', 24, 0, 1, 1.0, 1.0, 2),
    makeOrbit('Close flyby, Parker-style', 18, 0, 3, 1.0, 1.0, 2)
  ], { doom: true })
);

/* Per-destination environment tables for the new targets. Same shape as the original three entries. */
const addFactors = (table, values, extra) => {
  Object.entries(values).forEach(([dest, value]) => {
    table[dest] = { value, ...extra(dest) };
  });
};
addFactors(DATA.solarFluxFactor, { mercury: 3, venus: 1.9, jupiter: 0.037, saturn: 0.011, uranus: 0.0027, neptune: 0.0011, sun: 1 },
  () => recalled('Approximate sunlight relative to Earth at that distance (inverse-square).'));
addFactors(DATA.commsDistanceFactor, { mercury: 0.12, venus: 0.1, jupiter: 0.035, saturn: 0.015, uranus: 0.008, neptune: 0.005, sun: 0.5 },
  () => ({ ...GAMEPLAY, note: 'Simplified data-rate penalty from distance (real physics is roughly 1 / distance squared).' }));
addFactors(DATA.transitDaysBase, { mercury: 110, venus: 150, jupiter: 1000, saturn: 2000, uranus: 3600, neptune: 4400, sun: 90 },
  () => ({ unit: 'days', ...GAMEPLAY, note: 'Simplified one-way trip time with a chemical engine.' }));

DATA.realMissions.push(
  { dest: 'mercury', n: 'MESSENGER', yr: 2004, ins: ['i_cam', 'i_spec', 'i_mag'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'mercury', n: 'BepiColombo', yr: 2018, ins: ['i_cam', 'i_spec', 'i_mag'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'venus', n: 'Magellan', yr: 1989, ins: ['i_radar'], oi: 0, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'venus', n: 'Venus Express', yr: 2005, ins: ['i_spec', 'i_cam', 'i_mag'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'venus', n: 'Akatsuki', yr: 2010, ins: ['i_cam', 'i_therm'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'jupiter', n: 'Galileo', yr: 1989, ins: ['i_cam', 'i_spec', 'i_mag'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'jupiter', n: 'Juno', yr: 2011, ins: ['i_mag', 'i_spec'], oi: 0, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'saturn', n: 'Cassini', yr: 1997, ins: ['i_cam', 'i_spec', 'i_radar', 'i_mag', 'i_therm'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'uranus', n: 'Voyager 2', yr: 1977, ins: ['i_cam', 'i_mag'], oi: 2, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'neptune', n: 'Voyager 2', yr: 1977, ins: ['i_cam', 'i_mag'], oi: 2, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'sun', n: 'Parker Solar Probe', yr: 2018, ins: ['i_mag', 'i_spec'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' },
  { dest: 'sun', n: 'SOHO', yr: 1995, ins: ['i_cam', 'i_spec'], oi: 1, verified: false, src: 'UNVERIFIED_MEMORY' }
);

DATA.contracts.forEach(contract => {
  contract.thr = Math.round(contract.target * 0.6);
  contract.obj = OBJECTIVES_BY_MISSION[contract.id];
});
