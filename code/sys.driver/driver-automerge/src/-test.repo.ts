/**
 * @module
 * Safe: CRDT repository setup for web/workers.
 * No UI modules leak into this boundary.
 */
import { Crdt } from '@sys/driver-automerge/web';
import { type t, Url, slug } from './common.ts';

export { Log, Url } from '@sys/std';
export { Crdt };

/**
 * Raw repo configurations (serializable):
 */
export const TestConfig = {
  /**
   * For file-system unit-tests.
   */
  filesystem(opts: { uniq?: boolean; silent?: boolean } = {}): t.CrdtWorkerConfigFs {
    const { uniq = true, silent } = opts;
    return {
      kind: 'fs',
      storage: `.tmp/test/-worker.repo/${uniq ? slug() : '-main'}`,
      network: [],
      silent,
    };
  },

  /**
   * For UI/browser based testing.
   */
  web(opts: { silent?: boolean } = {}): t.CrdtWorkerWebConfig {
    const { silent } = opts;
    const { qs, isDev } = browserEnvironment();
    return {
      kind: 'web',
      silent,
      storage: { database: 'dev.crdt' },
      network: [
        { ws: 'waiheke.sync.db.team' },
        qs && { ws: qs },
        !qs && isDev && { ws: 'localhost:3030' },
        !qs && !isDev && { ws: 'waiheke.sync.db.team' },
      ].filter(Boolean),
    };
  },
};

/**
 * Helpers:
 */
function browserEnvironment() {
  const qs = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const isDev = isLocalhost && location.port !== '8080';
  return { isDev, isLocalhost, qs } as const;
}
