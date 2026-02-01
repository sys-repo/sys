import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.core.ts';
export type * from './t.Id.ts';
export type * from './t.Is.ts';
export type * from './t.meta.ts';
export type * from './t.network.ts';
export type * from './t.Str.ts';

type O = Record<string, unknown>;

/**
 * Common root API to the CRDT library:
 */
export type CrdtLib = {
  readonly Is: t.CrdtIsLib;
  readonly Id: t.CrdtIdLib;
  readonly Url: t.CrdtUrlLib;
  readonly Str: t.CrdtStrLib;
  readonly Cmd: t.CrdtCmdLib;
  readonly Worker: t.CrdtWorkerLib;
  readonly Graph: t.CrdtGraphLib;
  whenReady(doc?: t.Crdt.Ref): Promise<void>;
  toObject: t.CrdtToObject;
};

/**
 * URL helpers:
 */
export type CrdtUrlLib = {
  ws(input?: string): t.StringUrl;
};
