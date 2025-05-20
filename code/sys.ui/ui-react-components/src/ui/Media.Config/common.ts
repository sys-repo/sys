import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export { Slider } from '../Slider/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Config';

const filters: t.MediaFilterConfigMap = {
  brightness: { range: [0, 200], unit: '%', initial: 100 },
  contrast: { range: [0, 200], unit: '%', initial: 100 },
  saturate: { range: [0, 200], unit: '%', initial: 100 },
  grayscale: { range: [0, 200], unit: '%', initial: 0 },
  sepia: { range: [0, 200], unit: '%', initial: 0 },
  'hue-rotate': { range: [0, 200], unit: 'deg', initial: 0 },
  invert: { range: [0, 200], unit: '%', initial: 0 },
  blur: { range: [0, 20], unit: 'px', initial: 0 },
};

const zoom: t.MediaZoomConfigMap = {
  factor: { range: [0, 200], unit: '%', initial: 100 },
  centerX: { range: [0, 200], unit: '%', initial: 100 },
  centerY: { range: [0, 200], unit: '%', initial: 100 },
};

export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  debounce: 250,
  config: filters,
  zoom,
} as const;
export const D = DEFAULTS;
