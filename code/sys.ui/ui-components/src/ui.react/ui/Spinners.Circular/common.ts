import { Pkg, pkg } from '../common.ts';

export * from '../common.ts';

const name = 'Spinner.Circular';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  size: 22,
  viewBoxSize: 22, // Normalize the reference so the round cap reaches the edge of the square.
  spoke: { width: 2, innerY: 5 },
  spokes: 12,
  micro: { maxSize: 12, innerY: 6, spokes: 8 },
  pulse: { floor: 0.2, fadeEnd: 0.5, riseStart: 0.875 },
  period: 1000,
} as const;
export const DEFAULTS = D;
