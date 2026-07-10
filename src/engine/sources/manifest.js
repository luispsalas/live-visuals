import { GENERATIVE } from './generative.js';

// Single source-of-truth list of sources, shared by both windows. Each entry
// carries an explicit slot `value`: generative sources use their array index,
// while Camera and Video are PINNED to reserved values — so adding generative
// sources never shifts them and never breaks saved presets again.
export const CAMERA_INDEX = 98;
export const VIDEO_INDEX = 99;

export const SOURCE_LIST = [
  ...GENERATIVE.map((g, i) => ({ value: i, id: g.id, name: g.name })),
  { value: CAMERA_INDEX, id: 'camera', name: 'Camera' },
  { value: VIDEO_INDEX, id: 'video', name: 'Video file' },
];
