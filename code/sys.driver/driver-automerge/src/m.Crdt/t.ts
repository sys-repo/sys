import type { t } from './common.ts';
export type * from './t.core.ts';

type O = Record<string, unknown>;

/**
 * Common root API to the CRDT library:
 */
export type CrdtLib = {
  readonly Is: t.CrdtIsLib;
  readonly Url: t.CrdtUrlLib;
  readonly Worker: t.CrdtWorkerLib;
  whenReady(doc?: t.Crdt.Ref): Promise<void>;
  toObject: t.CrdtToObject;
};

/**
 * Boolean flag evaluators:
 */
export type CrdtIsLib = {
  /** Determine if the given value is a <CrdtRef> instance. */
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T>;

  /** Determine if the given value is a valid CRDT document id. */
  id(input?: unknown): input is t.DocumentId;
};

/**
 * URL helpers:
 */
export type CrdtUrlLib = {
  ws(input?: string): t.StringUrl;
};
