import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Boolean guard evaluators:
 */
export type CrdtIsLib = {
  /** Determine if the given value is a Repo instance. */
  repo(input?: unknown): input is t.Crdt.Repo;

  /** Determine if the given value is a t.Crdt.Ref (document) instance. */
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T>;

  /** Determine if the given value is a valid CRDT document id. */
  id(input?: unknown): input is t.DocumentId;

  /**
   * True if the given value is a CRDT URI string of the form "crdt:<id>"
   * where <id> is a valid document id.
   */
  uri(input?: unknown): boolean;

  /**
   * Determine if the given value is a worker-backed proxy shim.
   *
   * Implementations typically brand shims with `via: 'worker-proxy'`
   * so this check is structural and does not require importing worker types.
   */
  proxy(input?: unknown): input is { via: 'worker-proxy' };
};
