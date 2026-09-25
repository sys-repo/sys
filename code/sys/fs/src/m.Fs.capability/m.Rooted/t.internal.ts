import type { t } from './common.ts';
export type * from '../../common/t.ts';
export type { Time } from '@sys/std/t';

/** Open-file operations used internally by Rooted. */
export type FileHandle = {
  readonly write: (data: Uint8Array) => Promise<number>;
  readonly read: (data: Uint8Array) => Promise<number | null>;
  readonly sync: () => Promise<void>;
  readonly stat: () => Promise<Deno.FileInfo>;
  readonly tryLock: (exclusive?: boolean) => Promise<boolean>;
  readonly unlock: () => Promise<void>;
  readonly close: () => void;
};

/** Identity and mode evidence read through one open filesystem description. */
export type ModeInfo = {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly dev: number | null;
  readonly ino: number | null;
  readonly mode: number | null;
  readonly nlink: number | null;
};

/** Descriptor-bound permission mutation that cannot follow a later path replacement. */
export type ModeHandle = {
  readonly stat: () => Promise<ModeInfo>;
  readonly chmod: (mode: number) => Promise<void>;
  readonly close: () => Promise<void>;
};

/** Private host operations; tests replace methods to reproduce failures and races. */
export type Io = {
  readonly lstat: (path: string) => Promise<Deno.FileInfo>;
  readonly realPath: (path: string) => Promise<string>;
  readonly readDir: (path: string) => AsyncIterable<Deno.DirEntry>;
  readonly mkdir: (path: string, options?: Deno.MkdirOptions) => Promise<void>;
  readonly open: (path: string, options?: Deno.OpenOptions) => Promise<FileHandle>;
  readonly openMode: (path: string) => Promise<ModeHandle>;
  readonly link: (oldpath: string, newpath: string) => Promise<void>;
  readonly rename: (oldpath: string, newpath: string) => Promise<void>;
  readonly remove: (path: string, options?: Deno.RemoveOptions) => Promise<void>;
  readonly wait: (msecs: t.Msecs, signal: AbortSignal) => Promise<void>;
  readonly token: () => string;
};

/** Filesystem identity represented by non-negative safe integers. */
export type Identity = {
  readonly dev: number;
  readonly ino: number;
};

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
