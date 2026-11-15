/* File: js/api/mockData.js
 * Owner: Person A (Ashmin - structure), Person C (Yochan - values)
 * AI-assisted (update): Gemini, 2026-11-15 - rebalanced higher mission difficulty & tighter margins. Reviewed by a human: Yes Reviewed by Person C (Yochan)
 * AI-assisted (update): Claude, 2026-11-15 - win/loss tightening (outcome bands, audio, demos). Reviewed by a human: Yes Reviewed by Person C (Yochan)
 * AI-assisted: YES — Gemini, 2026-11-14; Gemini, 2026-11-15; Claude, 2026-11-14; Claude, 2026-11-15 (two manual burns). Reviewed by a human: Yes Reviewed by Person C (Yochan)
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
      value: 32,
      unit: 'months',
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Baseline spacecraft bus operational lifetime before radiation/wear degradation.'
    },
    batteryDepthOfDischarge: {
      value: 0.75,
      unit: 'fraction',
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Usable fraction of total battery energy capacity during orbital eclipse.'
    },
    baseStorageGb: {
      value: 24,
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
    moon: { value: 0.96, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Normalized solar irradiance at 1 AU.' },
    mars: { value: 0.43, src: 'UNVERIFIED_MEMORY', verified: false, note: 'Approximate solar flux ratio at Mars (~590 / 1361 W/m^2).' }
  },

  commsDistanceFactor: {
    earth: { value: 0.85, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Baseline downlink efficiency in Earth orbit.' },
    moon: { value: 0.75, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Normalized lunar downlink efficiency for gameplay.' },
    mars: { value: 0.12, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Deep Space Network Mars downlink rate factor.' }
  },

  transitDaysBase: {
    earth: { value: 0, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Direct insertion into Earth orbit.' },
    moon: { value: 5, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Typical lunar transfer duration.' },
    mars: { value: 210, unit: 'days', src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Simplified Hohmann-style Earth-to-Mars transit.' }
  },

  tank: {
    dry: 410,
    prop: 6000,
    c: 14,
    max: 6,
    src: 'SIMPLIFIED_FOR_GAMEPLAY',
    verified: false,
    note: 'Modular propellant tank dry mass (kg), propellant mass (kg), and cost ($M).'
  },

  launchers: {
    medium: {
      n: 'Medium launcher', cap: 9200, c: 95, rel: 0.95, img: 'launcher_medium',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative medium-lift LEO capacity (kg) and cost ($M).'
    },
    heavy: {
      n: 'Heavy launcher', cap: 27000, c: 210, rel: 0.96, img: 'launcher_heavy',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative heavy-lift LEO capacity (kg) and cost ($M).'
    },
    super: {
      n: 'Super-heavy launcher', cap: 54000, c: 415, rel: 0.93, img: 'launcher_super',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Representative super-heavy LEO capacity (kg) and cost ($M).'
    }
  },

  engines: {
    chem: {
      n: 'Chemical', isp: 365, m: 510, c: 34, tf: 1, pw: 0,
      img: 'engine_chemical', pl: 'plume_chemical', patch: 'chem',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'High-thrust bipropellant stage; lower specific impulse.'
    },
    nuclear: {
      n: 'Nuclear thermal', isp: 890, m: 3350, c: 155, tf: 0.8, pw: 0,
      img: 'engine_nuclear', pl: 'plume_nuclear', patch: 'nuc',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'High specific impulse thermal propulsion; heavy reactor mass.'
    },
    ion: {
      n: 'Ion', isp: 3100, m: 420, c: 68, tf: 1, pw: 1650, dvDay: 16,
      img: 'engine_ion', pl: 'plume_ion', patch: 'ion',
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      note: 'Very high specific impulse electric propulsion; requires 1650 W continuous power.'
    }
  },

  parts: {
    bus_std: { g: 'bus', n: 'Standard bus', m: 460, pw: 210, c: 28, rel: 0.95, hard: 0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bus_rad: { g: 'bus', n: 'Hardened bus', m: 630, pw: 245, c: 50, rel: 0.96, hard: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bus_red: { g: 'bus', n: 'Hardened + backup computer', m: 790, pw: 280, c: 76, rel: 0.98, hard: 1, red: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    sol_s: { g: 'pow', n: 'Small solar wing', m: 60, gen: 480, c: 5, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    sol_l: { g: 'pow', n: 'Large solar wing', m: 140, gen: 1050, c: 11, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    bat: { g: 'pow', n: 'Battery', m: 46, wh: 580, c: 4, max: 4, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    rtg: { g: 'pow', n: 'Radioisotope generator', m: 62, gen: 310, rtg: 1, c: 42, max: 3, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false, note: 'Heat-powered. Output does not depend on sunlight, so it works far from the Sun.' },
    ant_lg: { g: 'com', n: 'Low-gain antenna', m: 10, pw: 25, mb: 7, c: 3, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    ant_mg: { g: 'com', n: 'Medium-gain antenna', m: 24, pw: 65, mb: 28, c: 7, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    ant_hg: { g: 'com', n: 'High-gain dish', m: 48, pw: 125, mb: 110, c: 15, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    rec: { g: 'com', n: 'Data recorder', m: 15, pw: 8, gb: 140, c: 4, max: 2, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_cam: { g: 'sci', n: 'Camera', m: 42, pw: 65, c: 22, data: 62, sci: 30, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_therm: { g: 'sci', n: 'Thermal imager', m: 38, pw: 55, c: 28, data: 28, sci: 26, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_spec: { g: 'sci', n: 'Spectrometer', m: 58, pw: 78, c: 38, data: 20, sci: 40, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_radar: { g: 'sci', n: 'Radar sounder', m: 92, pw: 245, c: 60, data: 115, sci: 56, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
    i_mag: { g: 'sci', n: 'Magnetometer', m: 18, pw: 22, c: 12, data: 4, sci: 15, max: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
  },

  contracts: [
    {
      id: 'earth', months: 24, n: 'Earth · Blue Sentinel', dest: 'earth', target: 76, cap: 305,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low polar orbit', dv: 0.65, ecl: 0.38, per: 1.8, contact: 0.15, res: 1.0, rad: 0, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Medium orbit', dv: 2.5, ecl: 0.22, per: 12, contact: 0.32, res: 0.65, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Geostationary', dv: 4.5, ecl: 0.02, per: 24, contact: 0.95, res: 0.4, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
      ]
    },
    {
      id: 'moon', months: 24, n: 'Moon · Selene Watch', dest: 'moon', target: 74, cap: 430,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low polar orbit', dv: 4.15, ecl: 0.40, per: 2.2, contact: 0.45, res: 1.0, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Elliptical orbit', dv: 3.9, ecl: 0.22, per: 12, contact: 0.65, res: 0.65, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Halo-type orbit', dv: 3.6, ecl: 0.03, per: 150, contact: 0.90, res: 0.35, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
      ]
    },
    {
      id: 'mars', months: 24, n: 'Mars · Red Survey', dest: 'mars', target: 82, cap: 640,
      src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false,
      orbits: [
        { n: 'Low orbit', dv: 5.7, ecl: 0.40, per: 2.2, contact: 0.45, res: 1.0, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'Elliptical orbit', dv: 5.0, ecl: 0.22, per: 12, contact: 0.60, res: 0.65, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false },
        { n: 'High orbit', dv: 4.6, ecl: 0.12, per: 30, contact: 0.75, res: 0.35, rad: 1, src: 'SIMPLIFIED_FOR_GAMEPLAY', verified: false }
      ]
    }
  ],

  marginPolicies: {
    easy: {
      v: 0.15,
      verified: true,
      src: 'NASA_CUBESAT101 (p. 13): projects should carry at least 10-15% reserves.'
    },
    hard: {
      v: 0.35,
      verified: true,
      src: 'JPL_CML (§V, Fig. 8b): CML 4 checklist requires 35% margin on dry mass, power, and energy.'
    }
  },

  reviewThreshold: {
    v: 0.85,
    verified: true,
    src: 'JPL_CML (§V): a concept counts as mature when at least 85% of checklist items are complete.'
  },

  flightModel: {
    balanceGoodPx: 10,
    balanceLimitPx: 30,
    balancePenaltyAtLimit: 0.25,
    failBelowThresholdFactor: 0.82,
    amberPenaltyFactor: 0.85,
    signOffBonus: 0.03,
    reviewFailPenalty: 0.08,
    reliabilityMin: 0.1,
    reliabilityMax: 0.99,
    burnBonusMax: 0.06,
    burns: {
      departure: { target: 0.8, zoneHalfWidth: 0.12, fillSeconds: 2.1, weight: 0.5 },
      insertion: { target: 0.65, zoneHalfWidth: 0.065, fillSeconds: 2.3, weight: 0.5 }
    },
    src: 'SIMPLIFIED_FOR_GAMEPLAY',
    verified: false,
    note: 'Gameplay constants. Balance limits are in screen pixels between centre of mass and thrust line.'
  },

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
      scienceFactor: 0.78,
      trigger: { orbitField: 'rad', gte: 1 },
      src: 'NASA DONKI Space Weather / SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Triggered in radiation belts or during active solar flare alerts. Immune with a hardened bus.'
    },
    {
      id: 'ground_outage',
      imm: 'rec',
      scienceFactor: 0.80,
      trigger: { orbitField: 'contact', lte: 0.60 },
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Triggered when DSN ground contact is limited. Immune with a data recorder.'
    },
    {
      id: 'computer_glitch',
      imm: 'red',
      scienceFactor: 0.74,
      trigger: { minTransitDays: 100 },
      src: 'SIMPLIFIED_FOR_GAMEPLAY',
      verified: false,
      note: 'Triggered on deep-space missions (>100 days from Earth). Immune with a backup flight computer.'
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
  makeDestination('mercury', 1, 'Mercury · Hot Rock', 64, 1200, 60, [
    makeOrbit('Low polar orbit', 11.6, 0.32, 2.3, 0.42, 1.0, 2),
    makeOrbit('Elliptical orbit (12 h)', 10.8, 0.12, 12, 0.60, 0.65, 2),
    makeOrbit('High orbit', 10.0, 0.04, 24, 0.78, 0.35, 2)
  ]),
  makeDestination('venus', 2, 'Venus · Veiled Sister', 72, 820, 48, [
    makeOrbit('Low polar orbit', 6.4, 0.36, 2.2, 0.46, 1.0, 1),
    makeOrbit('Elliptical orbit', 5.4, 0.12, 24, 0.62, 0.65, 1),
    makeOrbit('High orbit', 5.0, 0.06, 48, 0.78, 0.35, 1)
  ]),
  makeDestination('jupiter', 5, 'Jupiter · King’s Gamble', 34, 1020, 108, [
    makeOrbit('Polar elliptical orbit (Juno-like)', 7.6, 0.04, 100, 0.50, 1.0, 2),
    makeOrbit('Wide orbit among the moons', 7.2, 0.03, 150, 0.62, 0.65, 2),
    makeOrbit('Distant capture orbit', 6.8, 0.02, 200, 0.78, 0.35, 1)
  ]),
  makeDestination('saturn', 6, 'Saturn · Ring Lord', 34, 1080, 168, [
    makeOrbit('Ring-grazing polar orbit', 8.6, 0.03, 100, 0.50, 1.0, 1),
    makeOrbit('Titan-tour orbit', 8.2, 0.02, 150, 0.62, 0.65, 1),
    makeOrbit('Distant orbit', 7.8, 0.01, 200, 0.78, 0.35, 1)
  ]),
  makeDestination('uranus', 7, 'Uranus · Sideways World', 25, 1180, 264, [
    makeOrbit('Polar orbit', 9.7, 0.03, 100, 0.50, 1.0, 1),
    makeOrbit('Moon-tour orbit', 9.3, 0.02, 150, 0.62, 0.65, 1),
    makeOrbit('Distant orbit', 8.9, 0.01, 200, 0.78, 0.35, 1)
  ]),
  makeDestination('neptune', 8, 'Neptune · Edge of the Map', 25, 1280, 324, [
    makeOrbit('Polar orbit', 10.4, 0.03, 100, 0.50, 1.0, 1),
    makeOrbit('Triton-tour orbit', 10.0, 0.02, 150, 0.62, 0.65, 1),
    makeOrbit('Distant orbit', 9.6, 0.01, 200, 0.78, 0.35, 1)
  ]),
  makeDestination('sun', 10, 'The Sun · Solar Dive', 55, 980, 48, [
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
addFactors(DATA.commsDistanceFactor, { mercury: 0.14, venus: 0.13, jupiter: 0.05, saturn: 0.028, uranus: 0.016, neptune: 0.011, sun: 0.5 },
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
  contract.thr = Math.round(contract.target * 0.65);
  contract.obj = OBJECTIVES_BY_MISSION[contract.id];
});
