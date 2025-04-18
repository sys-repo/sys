import { type t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
export const DEFAULTS = {
  sandbox: true,
  get loading(): t.IFrameLoading {
    return 'eager';
  },
} as const;
