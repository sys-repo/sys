import { Fs } from '@sys/fs';
import { FsCapability } from '@sys/fs/capability';
import { createRooted, DEFAULT_IO, type t, withIo } from './common.ts';

/** Complete the native rename, then reject it and one reconciliation observation. */
export async function unreconciledRename(root: string, observation: 'destination' | 'source') {
  const destination = Fs.join(await DEFAULT_IO.realPath(root), 'unpacked');
  let moved = false;
  let stagePath = '';
  let removals = 0;
  const io = withIo({
    async mkdir(path, options) {
      await DEFAULT_IO.mkdir(path, options);
      if (Fs.basename(path) === 'content') stagePath = path;
    },
    async rename(from, to) {
      await DEFAULT_IO.rename(from, to);
      if (to === destination) {
        moved = true;
        throw new Error('rename after effect');
      }
    },
    async lstat(path) {
      if (
        moved && (observation === 'destination' ? path === destination : path === stagePath)
      ) {
        throw new Error('reconciliation');
      }
      return await DEFAULT_IO.lstat(path);
    },
    async remove(path, options) {
      if (moved) removals++;
      await DEFAULT_IO.remove(path, options);
    },
  });
  const rooted: t.FsRooted.Lib = {
    ...FsCapability.Rooted,
    create: (options) => createRooted(options, io),
  };
  return {
    rooted,
    destination,
    get stagePath() {
      return stagePath;
    },
    get removals() {
      return removals;
    },
  };
}
