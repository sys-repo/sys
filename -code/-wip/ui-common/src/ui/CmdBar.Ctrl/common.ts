import { DEFAULTS as BASE, type t } from '../CmdBar/common.ts';
export * from '../CmdBar/common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  ...BASE,
  symbol: {
    cmd: Symbol('cmd'),
    paths: Symbol('paths'),
  },
  get meta(): t.CmdBarMeta {
    return { history: [] };
  },
} as const;
