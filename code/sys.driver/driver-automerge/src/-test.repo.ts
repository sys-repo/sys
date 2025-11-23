/**
 * @module
 * Safe: CRDT repository setup for web/workers.
 * No UI modules leak into this boundary.
 */
import { Crdt } from '@sys/driver-automerge/web';
import { type t, slug } from './common.ts';

export { Log, Url } from '@sys/std';
export { Crdt };

/**
 * Raw repo configurations (serializable):
 */
export const TestConfig = {
  /**
   * File-system unit-tests.
   */
  fs(opts: { uniq?: boolean; silent?: boolean } = {}): t.CrdtWorkerSpawnConfigFs {
    const { uniq = true, silent } = opts;
    return {
      kind: 'fs',
      storage: `.tmp/test/-worker.repo/${uniq ? slug() : '-main'}`,
      network: [],
      silent,
    };
  },
};
