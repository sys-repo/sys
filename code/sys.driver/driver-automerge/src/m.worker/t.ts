import type { t } from './common.ts';

type O = Record<string, unknown>;

export type * from './t.config.ts';
export type * from './t.lib.ts';
export type * from './t.wire.ts';

/**
 * Worker-backed facade for a CRDT repo.
 *
 * Structurally a `t.CrdtRepo` with an extra `via: 'worker-proxy'` brand
 * so callers can distinguish worker-based repos from local ones.
 */
export type CrdtRepoWorkerProxy = t.CrdtRepo & {
  readonly via: 'worker-proxy';
};

/**
 * Worker-backed facade for a CRDT document reference.
 *
 * Structurally a `t.CrdtRef<T>` with an extra `via: 'worker-proxy'` brand
 * so callers can distinguish worker-based docs from local ones.
 */
export type CrdtDocWorkerProxy<T extends O = O> = t.CrdtRef<T> & {
  readonly via: 'worker-proxy';
};
