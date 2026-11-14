/* File: js/config.js
 * Owner: Person B (Saurav)
 * AI-assisted: YES — Gemini, 2026-11-14. Reviewed by a human: NO.
 * Sources used: none
 */

export const ROLES = {
  Director: ['plan'],
  Engineer: ['stk', 'pow'],
  Science: ['sci'],
  Comms: ['com']
};

export const PART_DIMENSIONS = {
  bus: [130, 91],
  tank: [60, 120],
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
  ['top', 0.5, 0],
  ['bottom', 0.5, 1],
  ['L1', 0, 0.3],
  ['L2', 0, 0.75],
  ['R1', 1, 0.3],
  ['R2', 1, 0.75]
];

export const ATTACHMENT_NODES = {
  bus: STACK_AND_RADIAL_NODES,
  tank: STACK_AND_RADIAL_NODES,
  eng: [['top', 0.5, 0]],
  sol: [['in', 0, 0.5]],
  ant: [['base', 0.5, 1]],
  sm: [['in', 0, 0.5]]
};

export const MAX_PARTS = 40;
export const SNAP_RADIUS_PX = 40;
export const MAX_CANDIDATES = 3;
export const MAX_HISTORY = 40;
export const DEFAULT_SEED = 20261115;

export const API_CONFIG = {
  enableLiveFetch: false,
  endpoint: 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY',
  timeoutMs: 2500
};