/* File: js/api/mockData.js
 * Owner: Person A (Ashmin - structure), Person C (Yochan - values)
 * AI-assisted: YES — Gemini, 2026-11-14; Gemini, 2026-11-15; Claude, 2026-11-14; Claude, 2026-11-15 (two manual burns). Reviewed by a human:  modified:   js/core/career.js
        modified:   js/core/engine.js
        modified:   js/core/planets.js
        modified:   js/core/state.js
 * Sources used: NASA_CUBESAT101, JPL_CML, NASA_SE_WEBINAR
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
      value: 35,
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
    mars: { value: 0.14, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Deep Space Network Mars downlink rate factor.' }
  },

  transitDaysBase: {
    earth: { value: 0, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Direct insertion into Earth orbit.' },
    moon: { value: 5, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Typical lunar transfer duration.' },
    mars: { value: 210, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Simplified Hohmann-style Earth-to-Mars transit.' }
  },

  tank: {
    dry: 380,
    prop: 6200,
    c: 12,
    max: 6,
    src: 'SIMPLIFIED_FOR_GAMEPLAY',
    verified: false,
    note: 'Modular propellant tank dry mass (kg), propellant mass (kg), and cost ($M).'
  },

  launchers: {
    medium: {
      n: 'Medium launcher', cap: 9500, c: 90, rel: 0.96, img: 'launcher_medium',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative medium-lift LEO capacity (kg) and cost ($M).'
    },
    heavy: {
      n: 'Heavy launcher', cap: 28000, c: 200, rel: 0.97, img: 'launcher_heavy',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative heavy-lift LEO capacity (kg) and cost ($M).'
    },
    super: {
      n: 'Super-heavy launcher', cap: 55000, c: 400, rel: 0.94, img: 'launcher_super',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative super-heavy LEO capacity (kg) and cost ($M).'
    }
  },

  engines: {
    chem: {
      n: 'Chemical', isp: 380, m: 480, c: 30, tf: 1, pw: 0,
      img: 'engine_chemical', pl: 'plume_chemical', patch: 'chem',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'High-thrust bipropellant stage; lower specific impulse.'
    },
    nuclear: {
      n: 'Nuclear thermal', isp: 920, m: 3200, c: 145, tf: 0.8, pw: 0,
      img: 'engine_nuclear', pl: 'plume_nuclear', patch: 'nuc',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'High specific impulse thermal propulsion; heavy reactor mass.'
    },
    ion: {
      n: 'Ion', isp: 3200, m: 380, c: 60, tf: 1, pw: 1500, dvDay: 18,
      img: 'engine_ion', pl: 'plume_ion', patch: 'ion',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'Very high specific impulse electric propulsion; requires 1500 W continuous power.'
    }
  },

  parts: {
    bus_std: { g: 'bus', n: 'Standard bus', m: 440, pw: 190, c: 25, rel: 0.96, hard: 0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bus_rad: { g: 'bus', n: 'Hardened bus', m: 600, pw: 220, c: 45, rel: 0.97, hard: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bus_red: { g: 'bus', n: 'Hardened + backup computer', m: 750, pw: 250, c: 70, rel: 0.99, hard: 1, red: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    sol_s: { g: 'pow', n: 'Small solar wing', m: 55, gen: 520, c: 4, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    sol_l: { g: 'pow', n: 'Large solar wing', m: 130, gen: 1150, c: 9, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bat: { g: 'pow', n: 'Battery', m: 42, wh: 650, c: 3, max: 4, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    rtg: { g: 'pow', n: 'Radioisotope generator', m: 55, gen: 340, rtg: 1, c: 38, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Heat-powered. Output does not depend on sunlight, so it works far from the Sun.' },
    ant_lg: { g: 'com', n: 'Low-gain antenna', m: 8, pw: 20, mb: 8, c: 2, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    ant_mg: { g: 'com', n: 'Medium-gain antenna', m: 20, pw: 55, mb: 32, c: 5, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    ant_hg: { g: 'com', n: 'High-gain dish', m: 42, pw: 110, mb: 120, c: 12, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    rec: { g: 'com', n: 'Data recorder', m: 12, pw: 5, gb: 160, c: 3, max: 2, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_cam: { g: 'sci', n: 'Camera', m: 38, pw: 55, c: 20, data: 55, sci: 32, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_therm: { g: 'sci', n: 'Thermal imager', m: 34, pw: 45, c: 25, data: 24, sci: 28, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_spec: { g: 'sci', n: 'Spectrometer', m: 52, pw: 65, c: 35, data: 16, sci: 42, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_radar: { g: 'sci', n: 'Radar sounder', m: 85, pw: 220, c: 55, data: 100, sci: 60, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_mag: { g: 'sci', n: 'Magnetometer', m: 15, pw: 15, c: 10, data: 2, sci: 16, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
  },

  contracts: [
    {
      id: 'earth', months: 24, n: 'Earth · Blue Sentinel', dest: 'earth', target: 65, cap: 320,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low polar orbit', dv: 0.4, ecl: 0.35, per: 1.6, contact: 0.16, res: 1.0, rad: 0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Medium orbit', dv: 2.2, ecl: 0.2, per: 12, contact: 0.35, res: 0.65, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Geostationary', dv: 4.2, ecl: 0.01, per: 24, contact: 1.0, res: 0.4, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
      ]
    },
    {
      id: 'moon', months: 24, n: 'Moon · Selene Watch', dest: 'moon', target: 50, cap: 380,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low polar orbit', dv: 3.9, ecl: 0.38, per: 2, contact: 0.5, res: 1.0, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Elliptical orbit', dv: 3.7, ecl: 0.2, per: 12, contact: 0.7, res: 0.65, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Halo-type orbit', dv: 3.4, ecl: 0.02, per: 150, contact: 0.95, res: 0.35, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
      ]
    },
    {
      id: 'mars', months: 24, n: 'Mars · Red Survey', dest: 'mars', target: 72, cap: 680,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low orbit', dv: 5.4, ecl: 0.38, per: 2, contact: 0.5, res: 1.0, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Elliptical orbit', dv: 4.7, ecl: 0.2, per: 12, contact: 0.65, res: 0.65, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'High orbit', dv: 4.4, ecl: 0.1, per: 30, contact: 0.8, res: 0.35, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
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

  flightModel: {
    balanceGoodPx: 14,
    balanceLimitPx: 40,
    balancePenaltyAtLimit: 0.2,
    amberPenaltyFactor: 0.75,
    signOffBonus: 0.03,
    reviewFailPenalty: 0.06,
    reliabilityMin: 0.1,
    reliabilityMax: 0.99,
    // Manual burns (optional skill bonus), in mission order. For each one the player holds a button and lets go
    // inside a target zone. fill 0..1 is how full the gauge is at release; the zone is target +/- zoneHalfWidth.
    // The insertion zone is narrower, so it is harder. Auto-pilot = no burn = no bonus, never a penalty.
    // burnBonusMax is the most extra science (a fraction) ALL burns together can add. Each burn's `weight` is its
    // share of that cap, so the weights must add up to 1.
    burnBonusMax: 0.06,
    burns: {
      departure: { target: 0.8, zoneHalfWidth: 0.15, fillSeconds: 2.2, weight: 0.5 },
      insertion: { target: 0.65, zoneHalfWidth: 0.08, fillSeconds: 2.4, weight: 0.5 }
    },
    src: 'SIMPLIFIED_FOR_GAMEPLAY',
    verified: false,
    note: 'Gameplay constants. Balance limits are in screen pixels between centre of mass and thrust line. Burn values: the bonus is a simplified gameplay reward (up to +6% science for both burns together), not a real engine model.'
  },

  /**
   * Layout of the launch-view canvas (Stage 3). VISUALS ONLY: nothing here decides an outcome.
   * Orbit rings are NOT to scale (real distances would put Mercury on top of the Sun), they are spaced
   * so every planet fits on screen. Radii are fractions of the view's half-size.
   */
  flightViz: {
    startAngleDeg: 135,
    fitRadius: 0.92,
    sunSize: 0.07,
    ringRadius: { mercury: 0.16, venus: 0.26, earth: 0.36, mars: 0.48, jupiter: 0.6, saturn: 0.72, uranus: 0.84, neptune: 0.95 },
    local: { earthSize: 0.11, parkRing: 0.2, earthRings: [0.34, 0.5, 0.66], moonRing: 0.82 },
    orbitRings: [0.4, 0.58, 0.76],
    bodyPx: { earth: 22, moon: 18, planet: 28 },
    color: {
      sun: '#ffb347', mercury: '#b5a79a', venus: '#e8c98a', earth: '#4fa3e0', moon: '#cfcfcf', mars: '#d96b45',
      jupiter: '#d9b38c', saturn: '#e6d3a1', uranus: '#8fe0e6', neptune: '#5b7de8'
    },
    ascendMs: 8000,
    coastMs: 5500,
    diveMs: 4500,
    src: 'SIMPLIFIED_FOR_GAMEPLAY',
    verified: false,
    note: 'Display layout only. Not to scale and not real orbital data.'
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

  events: [
    {
      id: 'solar_flare',
      imm: 'hard',
      scienceFactor: 0.82,
      trigger: { orbitField: 'rad', gte: 1 },
      src: 'NASA DONKI Space Weather / SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Triggered in radiation belts or during active solar flare alerts. Immune with a hardened bus.'
    },
    {
      id: 'ground_outage',
      imm: 'rec',
      scienceFactor: 0.85,
      trigger: { orbitField: 'contact', lte: 0.55 },
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Triggered when DSN ground contact is limited. Immune with a data recorder.'
    },
    {
      id: 'computer_glitch',
      imm: 'red',
      scienceFactor: 0.78,
      trigger: { minTransitDays: 120 },
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Triggered on deep-space missions (>120 days from Earth). Immune with a backup flight computer.'
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

const GAMEPLAY = { src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false };
const recalled = note => ({ src: 'UNVERIFIED_MEMORY', verified: false, note });

const makeOrbit = (n, dv, ecl, per, contact, res, rad) => ({ n, dv, ecl, per, contact, res, rad, ...GAMEPLAY });
const makeDestination = (id, ord, n, target, cap, life, orbits, extra = {}) => ({
  id, months: 24, n, dest: id, target, cap, ord, life, orbits, ...GAMEPLAY, ...extra
});

const CONTRACT_ORDER = { earth: 3, moon: 3.5, mars: 4 };
DATA.contracts.forEach(contract => { contract.ord = CONTRACT_ORDER[contract.id]; });

DATA.contracts.push(
  makeDestination('mercury', 1, 'Mercury · Hot Rock', 60, 1250, 60, [
    makeOrbit('Low polar orbit', 11.4, 0.3, 2.3, 0.45, 1.0, 2),
    makeOrbit('Elliptical orbit (12 h)', 10.6, 0.1, 12, 0.65, 0.65, 2),
    makeOrbit('High orbit', 9.8, 0.03, 24, 0.8, 0.35, 2)
  ]),
  makeDestination('venus', 2, 'Venus · Veiled Sister', 68, 850, 48, [
    makeOrbit('Low polar orbit', 6.2, 0.35, 2.2, 0.5, 1.0, 1),
    makeOrbit('Elliptical orbit', 5.2, 0.1, 24, 0.65, 0.65, 1),
    makeOrbit('High orbit', 4.8, 0.05, 48, 0.8, 0.35, 1)
  ]),
  makeDestination('jupiter', 5, 'Jupiter · King’s Gamble', 32, 1050, 108, [
    makeOrbit('Polar elliptical orbit (Juno-like)', 7.4, 0.03, 100, 0.55, 1.0, 2),
    makeOrbit('Wide orbit among the moons', 7.0, 0.02, 150, 0.65, 0.65, 2),
    makeOrbit('Distant capture orbit', 6.6, 0.01, 200, 0.8, 0.35, 1)
  ]),
  makeDestination('saturn', 6, 'Saturn · Ring Lord', 32, 1100, 168, [
    makeOrbit('Ring-grazing polar orbit', 8.4, 0.02, 100, 0.55, 1.0, 1),
    makeOrbit('Titan-tour orbit', 8.0, 0.02, 150, 0.65, 0.65, 1),
    makeOrbit('Distant orbit', 7.6, 0.01, 200, 0.8, 0.35, 1)
  ]),
  makeDestination('uranus', 7, 'Uranus · Sideways World', 24, 1200, 264, [
    makeOrbit('Polar orbit', 9.5, 0.02, 100, 0.55, 1.0, 1),
    makeOrbit('Moon-tour orbit', 9.1, 0.02, 150, 0.65, 0.65, 1),
    makeOrbit('Distant orbit', 8.7, 0.01, 200, 0.8, 0.35, 1)
  ]),
  makeDestination('neptune', 8, 'Neptune · Edge of the Map', 24, 1300, 324, [
    makeOrbit('Polar orbit', 10.2, 0.02, 100, 0.55, 1.0, 1),
    makeOrbit('Triton-tour orbit', 9.8, 0.02, 150, 0.65, 0.65, 1),
    makeOrbit('Distant orbit', 9.4, 0.01, 200, 0.8, 0.35, 1)
  ]),
  makeDestination('sun', 10, 'The Sun · Solar Dive', 50, 1000, 48, [
    makeOrbit('Straight plunge', 24, 0, 1, 1.0, 1.0, 2),
    makeOrbit('Close flyby, Parker-style', 18, 0, 3, 1.0, 1.0, 2)
  ], { doom: true })
);

const addFactors = (table, values, extra) => {
  Object.entries(values).forEach(([dest, value]) => {
    table[dest] = { value, ...extra(dest) };
  });
};
addFactors(DATA.solarFluxFactor, { mercury: 3.0, venus: 1.9, jupiter: 0.037, saturn: 0.011, uranus: 0.0027, neptune: 0.0011, sun: 1 },
  () => recalled('Approximate sunlight relative to Earth at that distance (inverse-square).'));
addFactors(DATA.commsDistanceFactor, { mercury: 0.16, venus: 0.15, jupiter: 0.055, saturn: 0.03, uranus: 0.018, neptune: 0.012, sun: 0.5 },
  () => ({ ...GAMEPLAY, note: 'Deep Space Network downlink efficiency scaled for outer-planet gameplay.' }));
addFactors(DATA.transitDaysBase, { mercury: 110, venus: 150, jupiter: 950, saturn: 1850, uranus: 3200, neptune: 4000, sun: 90 },
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