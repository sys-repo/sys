import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';

const tubes = 499921561;
const name = 'Video.Background';

export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  TUBES: { id: tubes, src: `vimeo/${tubes}` },
  playing: true,
  opacity: 0.2,
  blur: 0,
} as const;
export const D = DEFAULTS;

export const STORAGE_KEY = {
  DEV: `dev:${D.displayName}`,
} as const;
