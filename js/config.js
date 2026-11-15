/* File: js/config.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-15. Reviewed by a human: YES Reviewd by Person C (Yochan)
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
  ['top', 0.5, 0.07],
  ['bottom', 0.5, 0.93],
  ['L1', 0.14, 0.32],
  ['L2', 0.14, 0.72],
  ['R1', 0.86, 0.32],
  ['R2', 0.86, 0.72]
];

export const ATTACHMENT_NODES = {
  bus: STACK_AND_RADIAL_NODES,
  tank: STACK_AND_RADIAL_NODES,
  eng: [['top', 0.5, 0.12]],
  sol: [['in', 0.12, 0.5]],
  ant: [['base', 0.5, 0.86]],
  sm: [['in', 0.16, 0.5]]
};

export const MAX_PARTS = 40;
export const SNAP_RADIUS_PX = 44;
export const MAX_CANDIDATES = 3;
export const MAX_HISTORY = 40;
export const DEFAULT_SEED = 20261115;

export const API_CONFIG = {
  enableLiveFetch: true,
  donkiFlareEndpoint: 'https://api.nasa.gov/DONKI/FLR?api_key=DEMO_KEY',
  donkiCmeEndpoint: 'https://api.nasa.gov/DONKI/CME?api_key=DEMO_KEY',
  timeoutMs: 6000
};