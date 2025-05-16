import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export { Slider } from '../Slider/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Filters';

const config: t.MediaFilterConfigMap = {
  brightness: { range: [0, 200], unit: '%', initial: 100 },
  contrast: { range: [0, 200], unit: '%', initial: 100 },
  saturate: { range: [0, 200], unit: '%', initial: 100 },
  grayscale: { range: [0, 200], unit: '%', initial: 0 },
  sepia: { range: [0, 200], unit: '%', initial: 0 },
  'hue-rotate': { range: [0, 200], unit: 'deg', initial: 0 },
  invert: { range: [0, 200], unit: '%', initial: 0 },
  opacity: { range: [0, 100], unit: '%', initial: 100 },
  blur: { range: [0, 50], unit: 'px', initial: 0 },
};

export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  config,
  debounce: 250,
} as const;
export const D = DEFAULTS;
