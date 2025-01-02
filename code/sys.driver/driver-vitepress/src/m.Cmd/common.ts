export * from '../common.ts';
export { Log } from '../u.Log/mod.ts';
export { Env } from '../m.Env/mod.ts';

export const DEFAULTS = {
  cmd: 'dev',
  open: undefined, // NB: use default.
} as const;
