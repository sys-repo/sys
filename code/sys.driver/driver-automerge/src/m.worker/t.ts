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

  /**
   * Fetch a document from a worker-proxied repo over RPC and return a
   * worker-branded CRDT ref wrapped in a TryResult.
   *
   * Precondition:
   *   - `repo` MUST be a worker-proxy. Passing a local repo is a programmer
   *     error and results in a thrown exception.
   *
   * Semantics:
   *   - Delegates to `repo.get(id, options)` on the worker side.
   *   - Domain failures (timeouts, not-found, deleted, etc) are returned as a
   *     `TryResult` failure.
   *   - Successful fetches return `{ ok: true, data: CrdtDocWorkerShim<T> }`.
   *
   * This is the core worker-side doc retrieval primitive upon which all
   * higher-level helpers build.
   */
  readonly doc: <T extends O = O>(
    repo: CrdtRepoWorkerShim | t.Crdt.Repo, // ← NB: throws if repo not a proxy/shim.
    id: t.StringId,
    options?: t.CrdtRepoGetOptions,
  ) => Promise<t.TryResult<t.CrdtDocWorkerShim<T>>>;
};

/**
 * Worker-backed facade for a CRDT repo.
 *
 * Structurally a `t.CrdtRepo` with an extra `via: 'worker-proxy'` brand
 * so callers can distinguish worker-based repos from local ones.
 */
export type CrdtRepoWorkerShim = t.CrdtRepo & {
  readonly via: 'worker-proxy';
};

/**
 * Worker-backed facade for a CRDT document reference.
 *
 * Structurally a `t.CrdtRef<T>` with an extra `via: 'worker-proxy'` brand
 * so callers can distinguish worker-based docs from local ones.
 */
export type CrdtDocWorkerShim<T extends O = O> = t.CrdtRef<T> & {
  readonly via: 'worker-proxy';
};
