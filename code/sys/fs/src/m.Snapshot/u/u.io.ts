import type { t } from '../common.ts';

const lstat = Deno.lstat;
const open = Deno.open;

export const DEFAULT_SNAPSHOT_IO: t.SnapshotIo = Object.freeze({
  lstat,
  open: (path) => open(path, { read: true }),
});
