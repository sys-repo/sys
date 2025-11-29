import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Exports from an imported `hook.ts` file.
 */
export type DocumentGraphHookModule = {
  readonly onDoc?: t.DocumentGraphHook;
};

/**
 * User-supplied function invoked for each document reached during a
 * CRDT graph walk. Executes in traversal order and may be async.
 */
export type DocumentGraphHook<T extends O = O> = (
  ctx: DocumentGraphHookCtx<T>,
) => void | Promise<void>;

/**
 * Context passed to a `DocumentGraphHook`.
 *
 * All values are read-only snapshots of the traversal state:
 * - `root`     The CRDT id where the traversal began.
 * - `id`       The CRDT id of the current document.
 * - `snapshot` Immutable document snapshot (`{ current: T }`).
 * - `depth`    Depth from the root (0 = root).
 * - `log`      Lightweight logging helper for hook output.
 */
export type DocumentGraphHookCtx<T extends O = O> = {
  readonly root: t.Crdt.Id;
  readonly id: t.Crdt.Id;
  readonly snapshot: t.ImmutableSnapshot<T>;
  readonly depth: number;
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
