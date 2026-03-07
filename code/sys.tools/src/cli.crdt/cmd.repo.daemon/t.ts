import { type t } from '../common.ts';

/**
 * Log entry for a CRDT repository.
 */
export type CrdtRepoLogEntry = {
  readonly at: t.UnixTimestamp;
  readonly event: CrdtRepoLogEvent;
};

export type CrdtRepoLogEvent =
  | { kind: 'wire'; payload: t.CrdtRepoWireEvent }
  | { kind: 'daemon:error'; message: string; detail: unknown }
  | { kind: 'daemon:info'; message: string };
