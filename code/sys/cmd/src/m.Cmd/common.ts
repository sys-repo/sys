import { slug, type t } from '../common.ts';

export * from '../common.ts';
export type * as u from './u.ts';

/**
 * Constants
 */
const paths: t.CmdPaths = {
  queue: ['queue'],
  log: ['log'],
};
const bounds: t.CmdQueueBounds = { min: 50, max: 100 };

export const DEFAULTS = {
  timeout: 3000,
  paths,
  id: () => slug(),
  tx: () => slug(),
  error: (message: string): t.ErrorLike => ({ message }),
  log(): t.CmdLog {
    return { total: { purged: 0 } };
  },
  queue: { bounds },
  symbol: {
    transport: Symbol('transport'),
    paths: Symbol('paths'),
    issuer: Symbol('issuer'),
  },
} as const;
