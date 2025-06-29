import type { t } from './common.ts';

export type * from './t.Ref.ts';
export type * from './t.Repo.ts';

type O = Record<string, unknown>;

/**
 * Boolean flag evaluators:
 */
export type CrdtIsLib = {
  /** Determine if the given value is a <CrdtRef> instance. */
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T>;

  /** Determind if the given value is a valid CRDT document id. */
  id(input?: unknown): input is t.DocumentId;
};

/**
 * URL helpers:
 */
export type CrdtUrlLib = {
  ws(input?: string): t.StringUrl;
};
