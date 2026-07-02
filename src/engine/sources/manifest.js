import { GENERATIVE } from './generative.js';

// Single source-of-truth ordering for sources, shared by both windows so slot
// indices line up. The output window builds real render objects in this order;
// the control window uses the names to populate the slot dropdowns.
export const SOURCE_LIST = [
  ...GENERATIVE.map((g) => ({ id: g.id, name: g.name })),
  { id: 'camera', name: 'Camera' },
  { id: 'video', name: 'Video file' },
];

export const CAMERA_INDEX = GENERATIVE.length;
export const VIDEO_INDEX = GENERATIVE.length + 1;
