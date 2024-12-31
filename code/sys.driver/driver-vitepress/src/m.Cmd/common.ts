import { PATHS } from '../common.ts';

export * from '../common.ts';
export { Log } from '../u.Log/mod.ts';

export const DEFAULTS = {
  cmd: 'dev',
  inDir: PATHS.inDir,
  open: undefined, // NB: use default.
} as const;
