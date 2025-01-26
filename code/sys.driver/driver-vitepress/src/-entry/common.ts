export * from '../common.ts';
export { VitepressLog } from '../m.Vitepress.Log/mod.ts';
export { Env } from '../m.Vitepress.Env/mod.ts';

export const DEFAULTS = {
  cmd: 'dev',
  open: undefined, // NB: use default.
} as const;
