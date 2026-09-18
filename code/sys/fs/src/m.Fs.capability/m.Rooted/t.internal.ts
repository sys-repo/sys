import type { t } from './common.ts';
export type * from '../../common/t.ts';
export type { Time } from '@sys/std/t';

/** Stage-local admission and settlement state, never a public capability. */
export type RootedActivity = {
  readonly ancestors: readonly RootedActivity[];
  readonly controller: AbortController;
  readonly drained: Set<() => void>;
  status: 'active' | 'promoting' | 'discarding' | 'published' | 'discarded';
  writer: 'unclaimed' | 'writing' | 'complete' | 'failed';
  borrowers: number;
  /** Whole-stage mode mutation excludes new descendant work until its handles settle. */
  sealing: boolean;
  closureLost: boolean;
};

/** Captured construction specification; content references are not executed during admission. */
export type RootedTreeInput = {
  readonly entries: readonly t.FsRooted.TreeEntry[];
  readonly directories: readonly t.FsRooted.TreeDirectory[];
  readonly options: t.FsRooted.TreeWriteOptions;
};

/** One owner-authenticated terminal and deadline for tree construction. */
export type RootedWriteContext = {
  readonly check: () => void;
  readonly changed: () => void;
  readonly fail: (kind: t.FsRooted.FailureKind, cause?: unknown) => t.FsRooted.Failure;
  readonly host: <T>(fn: () => Promise<T>) => Promise<T>;
  readonly producer: (fn: () => unknown) => Promise<unknown>;
  readonly cleanup: (fn: () => unknown) => Promise<void>;
  readonly dispose: () => Promise<void>;
};
