import type { t } from './common.ts';

export type * from './t.core.ts';
export type * from './t.meta.ts';
export type * from './t.network.ts';

type O = Record<string, unknown>;

/**
 * Common root API to the CRDT library:
 */
export type CrdtLib = {
  readonly Is: t.CrdtIsLib;
  readonly Url: t.CrdtUrlLib;
  readonly Worker: t.CrdtWorkerLib;
  readonly Graph: t.CrdtGraphLib;
  whenReady(doc?: t.Crdt.Ref): Promise<void>;
  toObject: t.CrdtToObject;
};

/**
 * Boolean flag evaluators:
 */
export type CrdtIsLib = {
  /** Determine if the given value is a Repo instance. */
  repo(input?: unknown): input is t.Crdt.Repo;

  /** Determine if the given value is a t.Crdt.Ref (document) instance. */
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T>;

  /** Determine if the given value is a valid CRDT document id. */
  id(input?: unknown): input is t.DocumentId;

  /**
   * Determine if the given value is a worker-backed proxy shim.
   *
   * Implementations typically brand shims with `via: 'worker-proxy'`
   * so this check is structural and does not require importing worker types.
   */
  proxy(input?: unknown): input is { via: 'worker-proxy' };
};

/**
 * URL helpers:
 */
export type CrdtUrlLib = {
  ws(input?: string): t.StringUrl;
};
