import type { t, WIRE_VERSION } from './common.ts';

export type * from './t.wire.ts';

/**
 * Type surface for the web-worker transport layer of the CRDT repo.
 * Defines the contract used by both the main-thread client and worker host.
 */
export type CrdtWorkerLib = {
  /** Protocol version tag for all CRDT wire messages. */
  readonly version: typeof WIRE_VERSION;

  /** Creates a worker-backed `Crdt.Repo` client façade on the main thread. */
  readonly repo: (port: MessagePort, opts?: { until?: t.UntilInput }) => t.CrdtRepo;


};

/**
 * Marker type representing a CRDT Repo façade operating over a worker boundary.
 *
 * Structurally identical to type `Crdt.Repo` but branded to indicate that all
 * operations are proxied through a `MessagePort` rather than executed in-process.
 */
export type CrdtRepoWorkerShim = t.CrdtRepo & {
  /** Branding flag that distinguishes worker-based repos from local ones. */
  readonly via: 'worker';
};
