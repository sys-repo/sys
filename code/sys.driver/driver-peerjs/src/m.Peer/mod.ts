/**
 * @module
 */
import type { t } from './common.ts';
import { maintainDyadConnection } from './u.maintainDyad.ts';

export const Peer: t.PeerLib = {
  maintainDyadConnection,
};
