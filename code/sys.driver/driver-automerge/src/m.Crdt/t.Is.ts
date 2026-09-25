import type { t } from './common.ts';

type O = Record<string, unknown>;

/** Boolean guard evaluators. */
export type Lib = {
  /** Determine if the given value is a Repo instance. */
  repo(input?: unknown): input is t.Crdt.Repo;

  /** Determine if the given value is a CRDT document ref instance. */
  ref<T extends O>(input?: unknown): input is t.Crdt.Ref<T>;

  /** Determine if the given value is a valid CRDT document id. */
  id(input?: unknown): input is t.Crdt.Id;

  /** Determine if the given value is a CRDT URI string. */
  uri(input?: unknown): boolean;

  /** Determine if the given value is a worker-backed proxy shim. */
  proxy(input?: unknown): input is { via: 'worker-proxy' };
};
