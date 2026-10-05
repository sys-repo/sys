import type { t } from './common.ts';
export type * from '../common/t.ts';

/** Captured caller options used throughout one snapshot operation. */
export type SnapshotInput = {
  readonly root: t.StringAbsoluteDir;
  readonly path: t.StringAbsolutePath;
  readonly maxBytes: t.NumberBytes;
  readonly until?: t.UntilInput;
  readonly timeout: t.Msecs;
};

/** Descriptor operations required by a stable file snapshot. */
export type SnapshotHandle = {
  readonly read: (buffer: Uint8Array) => Promise<number | null>;
  readonly stat: () => Promise<Deno.FileInfo>;
  readonly close: () => void | Promise<void>;
};

/** Host filesystem operations isolated for deterministic race and failure proofs. */
export type SnapshotIo = {
  readonly lstat: (path: string) => Promise<Deno.FileInfo>;
  readonly open: (path: string) => Promise<t.SnapshotHandle>;
};

/** Owned cancellation signal and cooperative work checkpoints. */
export type SnapshotContext = {
  readonly signal: AbortSignal;
  readonly checkpoint: () => void;
  readonly yield: () => Promise<void>;
};

/** Captured filesystem metadata used for snapshot evidence and drift comparisons. */
export type SnapshotObservation = {
  readonly file: boolean;
  readonly directory: boolean;
  readonly symlink: boolean;
  readonly size: number;
  readonly modified: number | null;
  readonly changed: number | null;
  readonly device: number | null;
  readonly inode: number | null;
};
