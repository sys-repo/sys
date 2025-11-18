import type { t, WIRE_VERSION } from './common.ts';

type O = Record<string, unknown>;

export type * from './t.wire.ts';

/**
 * Type surface for the web-worker transport layer of the CRDT repo.
 * Defines the contract used by both the main-thread client and worker host.
 */
export type CrdtWorkerLib = {
  /** Protocol version tag for all CRDT wire messages. */
  readonly version: typeof WIRE_VERSION;

  /** Creates a worker-backed `t.CrdtRepo` client facade on the main thread. */
  repo(port: MessagePort, opts?: { until?: t.UntilInput; stalledAfter?: t.Msecs }): t.CrdtRepo;

  /** Attaches a real repo instance to a `MessagePort` inside the worker. */
  attach(port: MessagePort, repo: t.CrdtRepo): void;

  /**
   * Listens for `crdt:attach` messages on the worker global scope and
   * automatically binds the provided repo to the received MessagePort.
   */
  listen(self: typeof globalThis, repo: t.CrdtRepo): void;

  /**
   * Spawns a worker and connects to its existing CRDT repo.
   * Establishes a MessageChannel link and returns both the worker handle
   * and the client-side repo facade bound to that connection.
   */
  spawn(
    url: string | URL | Worker,
    opts?: { worker?: WorkerOptions; until?: t.UntilInput },
  ): Promise<{ readonly worker: Worker; readonly repo: t.CrdtRepo }>;
};
