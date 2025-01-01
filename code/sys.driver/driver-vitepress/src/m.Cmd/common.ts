export * from '../common.ts';
export { Log } from '../u.Log/mod.ts';

export const DEFAULTS = {
  cmd: 'dev',
  open: undefined, // NB: use default.
} as const;
