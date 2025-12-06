import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * User-supplied function invoked for each document reached during a
 * CRDT graph walk. Executes in traversal order and may be async.
 */
export type DocumentGraphWalkHook<T extends O = O> = (
  ctx: DocumentGraphWalkHookCtx<T>,
) => void | Promise<void>;

/**
 * Context passed to the `onDoc` callback hook.
 *
 * All values are read-only snapshots of the traversal state:
 * - `root`     The CRDT id where the traversal began.
 * - `id`       The CRDT id of the current document.
 * - `snapshot` Immutable document snapshot (`{ current: T }`).
 * - `depth`    Depth from the root (0 = root).
 * - `log`      Lightweight logging helper for hook output.
 */
export type DocumentGraphWalkHookCtx<T extends O = O> = {
  readonly cmd: t.Crdt.Cmd.Client;
  readonly root: t.Crdt.Id;
  readonly id: t.Crdt.Id;
  readonly doc: t.ImmutableSnapshot<T>;
  readonly depth: number;
  readonly is: { root: boolean };
  log(...msg: (string | number)[]): void;
};

/**
 * Logging output per document-hook callback.
 */
export type DocumentGraphHookLog = {
  id: t.Crdt.Id;
  depth: number;
  log: t.StrBuilder;
};
