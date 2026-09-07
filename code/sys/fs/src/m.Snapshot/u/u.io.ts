/** Descriptor operations required by a stable file snapshot. */
export type SnapshotHandle = {
  readonly read: (buffer: Uint8Array) => Promise<number | null>;
  readonly stat: () => Promise<Deno.FileInfo>;
  readonly close: () => void | Promise<void>;
};

/** Host filesystem operations isolated for deterministic race and failure proofs. */
export type SnapshotIo = {
  readonly lstat: (path: string) => Promise<Deno.FileInfo>;
  readonly open: (path: string) => Promise<SnapshotHandle>;
};

const lstat = Deno.lstat;
const open = Deno.open;

export const DEFAULT_SNAPSHOT_IO: SnapshotIo = Object.freeze({
  lstat,
  open: (path) => open(path, { read: true }),
});
