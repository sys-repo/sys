import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { BarSpinner } from '../Spinners.Bar/mod.ts';
export * from './const.READY_STATE.ts';

/**
 * Constants:
 */
const name = 'VideoElement';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  scale: 1,
  loop: false,
  aspectRatio: '16/9',
  cornerRadius: 0,
} as const;
export const D = DEFAULTS;

/**
 * If you give a negative `rawEnd`, treat it as “duration + rawEnd.”
 * Otherwise just return it (or `undefined` if you passed none).
 */
export function resolveCropEnd(rawEnd: number | undefined, duration: number) {
  if (rawEnd == null) return duration;

  // NB: positive = absolute, negative = from-the-end.
  const abs = rawEnd >= 0 ? rawEnd : duration + rawEnd;
  return Math.max(0, abs);
}
