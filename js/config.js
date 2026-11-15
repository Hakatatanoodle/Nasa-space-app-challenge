/* File: js/config.js
 * Owner: Person B (Saurav)
 * AI-assisted (update): Gemini, 2026-11-15 - universal multi-directional attachment nodes for all parts. Reviewed by a human: YES, Person C (Yochan).
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: YES, Person C (Yochan).
 * Sources used: SPACEAPPS_CHALLENGE
 */

export const ROLES = {
  Director: ['plan'],
  Engineer: ['stk', 'pow'],
  Science: ['sci'],
  Comms: ['com']
};

export const PART_DIMENSIONS = {
  bus: [130, 91],
  tank: [64, 120],
  eng: [84, 109],
  ion: [96, 65],
  sol_s: [90, 45],
  sol_l: [150, 41],
  bat: [36, 28],
  rtg: [40, 34],
  rec: [36, 29],
  ant_lg: [38, 32],
  ant_mg: [50, 35],
  ant_hg: [70, 44],
  i_cam: [44, 27],
  i_therm: [44, 29],
  i_spec: [44, 24],
  i_radar: [58, 31],
  i_mag: [52, 16]
};

const STACK_AND_RADIAL_NODES = [
  ['top', 0.5, 0.06],
  ['bottom', 0.5, 0.94],
  ['L1', 0.12, 0.30],
  ['L2', 0.12, 0.70],
  ['R1', 0.88, 0.30],
  ['R2', 0.88, 0.70]
];

const ALL_FOUR_SIDES = [
  ['top', 0.5, 0.08],
  ['bottom', 0.5, 0.92],
  ['left', 0.10, 0.5],
  ['right', 0.90, 0.5]
];

export const ATTACHMENT_NODES = {
  bus: STACK_AND_RADIAL_NODES,
  tank: STACK_AND_RADIAL_NODES,
  eng: [
    ['top', 0.5, 0.10],
    ['left', 0.14, 0.45],
    ['right', 0.86, 0.45]
  ],
  sol: ALL_FOUR_SIDES,
  ant: [
    ['base', 0.5, 0.88],
    ['top', 0.5, 0.12],
    ['left', 0.12, 0.5],
    ['right', 0.88, 0.5]
  ],
  sm: ALL_FOUR_SIDES
};

export const MAX_PARTS = 40;
export const SNAP_RADIUS_PX = 48;
export const MAX_CANDIDATES = 3;
export const MAX_HISTORY = 40;
export const DEFAULT_SEED = 20261115;

export const API_CONFIG = {
  enableLiveFetch: true,
  donkiFlareEndpoint: 'https://api.nasa.gov/DONKI/FLR?api_key=DEMO_KEY',
  donkiCmeEndpoint: 'https://api.nasa.gov/DONKI/CME?api_key=DEMO_KEY',
  timeoutMs: 6000
};