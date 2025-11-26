import { type t } from '../common.ts';

/**
 * Log entry for a CRDT repository.
 */
export type CrdtRepoLogEntry = {
  readonly at: t.UnixTimestamp;
  readonly ev: t.CrdtRepoWireEvent;
};
