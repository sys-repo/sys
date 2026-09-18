import { Fs } from '@sys/fs';
import { FsCapability } from '@sys/fs/capability';
import { createRooted, DEFAULT_IO, type t, withIo, wrapFile } from './common.ts';

/**
 * Release: refuse lock identity, then fail after actual unlock and close.
 * Discard: cancel construction, then fail marker read and its actual close.
 * Promotion: publish, then fail marker read and its actual close during private cleanup.
 * Every result and compound failure comes from real Fs, never a fabricated promotion result.
 */
export async function compoundCleanup(
  root: string,
  boundary: 'release' | 'discard' | 'promotion',
  primaryKind: 'unsupported' | 'io-failure',
) {
  const destination = Fs.join(await DEFAULT_IO.realPath(root), 'unpacked');
  const controller = new AbortController();
  const events: string[] = [];
  let published = false;
  let discarding = false;
  let stagePath = '';
  let removalsAfterFailure = 0;
  const primaryCause = primaryKind === 'unsupported'
    ? new Deno.errors.NotSupported('SECRET: primary cleanup failure')
    : new Error('SECRET: primary cleanup failure');
  const io = withIo({
    async mkdir(path, options) {
      await DEFAULT_IO.mkdir(path, options);
      if (Fs.basename(path) === 'content') stagePath = path;
    },
    async remove(path, options) {
      if (events.includes('primary')) removalsAfterFailure++;
      await DEFAULT_IO.remove(path, options);
    },
    async rename(from, to) {
      await DEFAULT_IO.rename(from, to);
      if (to === destination) published = true;
    },
    async lstat(path) {
      if (boundary === 'release' && published && path.endsWith('.lock')) {
        events.push('primary');
        throw primaryCause;
      }
      return await DEFAULT_IO.lstat(path);
    },
    async open(path, options) {
      const file = await DEFAULT_IO.open(path, options);
      if (path.endsWith('.lock')) {
        return wrapFile(file, {
          async unlock() {
            await file.unlock();
            events.push('unlocked');
            if (boundary === 'release' && published) {
              events.push('secondary');
              throw new Error('SECRET: unlock after effect');
            }
          },
          close() {
            file.close();
            events.push('lock-closed');
            if (boundary === 'release' && published) {
              // The first separately recorded cleanup failure must survive a later one.
              throw new Deno.errors.NotSupported('SECRET: later close failure');
            }
          },
        });
      }
      if (boundary === 'discard' && Fs.basename(path) === 'empty') {
        return wrapFile(file, {
          close() {
            file.close();
            // Stop construction through real IO; Pi still owns the stage's discard.
            controller.abort();
          },
        });
      }
      const markerFault = boundary === 'discard' ? discarding : published;
      if (boundary === 'release' || !markerFault || Fs.basename(path) !== 'owner') return file;
      return wrapFile(file, {
        read() {
          events.push('primary');
          return Promise.reject(primaryCause);
        },
        close() {
          file.close();
          events.push('marker-closed', 'secondary');
          throw new Error('SECRET: marker close after effect');
        },
      });
    },
  });
  const rooted: t.FsRooted.Lib = {
    ...FsCapability.Rooted,
    async create(options) {
      const actual = await createRooted(options, io);
      return {
        ...actual,
        Stage: {
          ...actual.Stage,
          async discard(stage, options) {
            discarding = true;
            return await actual.Stage.discard(stage, options);
          },
        },
      };
    },
  };
  const queue: t.MutationQueue = async (_key, run) => {
    try {
      return await run();
    } finally {
      events.push('queue-released');
    }
  };
  return {
    rooted,
    queue,
    destination,
    signal: controller.signal,
    get published() {
      return published;
    },
    get stagePath() {
      return stagePath;
    },
    get removalsAfterFailure() {
      return removalsAfterFailure;
    },
    get events(): readonly string[] {
      return [...events];
    },
  };
}
