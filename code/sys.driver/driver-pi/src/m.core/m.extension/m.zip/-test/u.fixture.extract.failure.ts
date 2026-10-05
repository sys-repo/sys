import { Fs } from '@sys/fs';
import { FsCapability } from '@sys/fs/capability';
import { createRooted, DEFAULT_IO, type t, withIo, wrapFile } from './common.ts';

/** Refuse stage/lease observation or promotion, then fail the owner's internal cleanup. */
export async function ownerFailure(root: string, boundary: 'stage' | 'lease' | 'promotion') {
  const destination = Fs.join(await DEFAULT_IO.realPath(root), 'unpacked');
  let held = false;
  let refused = false;
  const io = withIo({
    async realPath(path) {
      if (boundary === 'stage' && Fs.basename(path) === 'content') {
        throw new Deno.errors.NotSupported('child root');
      }
      return await DEFAULT_IO.realPath(path);
    },
    async open(path, options) {
      const file = await DEFAULT_IO.open(path, options);
      if (boundary !== 'lease' || !path.endsWith('.lock')) return file;
      return wrapFile(file, {
        async tryLock(exclusive) {
          held = await file.tryLock(exclusive);
          return held;
        },
        async unlock() {
          await file.unlock();
          held = false;
          throw new Error('unlock after effect');
        },
      });
    },
    async lstat(path) {
      if (boundary === 'lease' && held && path === destination) {
        throw new Deno.errors.NotSupported('lease observation');
      }
      return await DEFAULT_IO.lstat(path);
    },
    async rename(from, to) {
      if (boundary === 'promotion' && to === destination) {
        refused = true;
        throw new Deno.errors.NotSupported('rename before effect');
      }
      await DEFAULT_IO.rename(from, to);
    },
    async remove(path, options) {
      if ((boundary === 'stage' || refused) && path.includes('.sys.rooted')) {
        throw new Error('cleanup');
      }
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
    get held() {
      return held;
    },
  };
}

/** Refuse native rename before effect; abort only after internal cleanup has removed an entry. */
export async function cancelDuringCleanup(root: string) {
  const destination = Fs.join(await DEFAULT_IO.realPath(root), 'unpacked');
  const controller = new AbortController();
  const events: string[] = [];
  let refused = false;
  let failure: t.FsRooted.Failure | undefined;
  const io = withIo({
    async rename(from, to) {
      if (to === destination) {
        refused = true;
        events.push('rename-refused');
        throw new Deno.errors.NotSupported('SECRET: rename before effect');
      }
      await DEFAULT_IO.rename(from, to);
    },
    async remove(path, options) {
      await DEFAULT_IO.remove(path, options);
      if (refused && !controller.signal.aborted) {
        events.push('cleanup-removed');
        controller.abort();
        events.push('cancelled');
      }
    },
    async open(path, options) {
      const file = await DEFAULT_IO.open(path, options);
      if (!path.endsWith('.lock')) return file;
      return wrapFile(file, {
        async unlock() {
          await file.unlock();
          events.push('unlocked');
        },
        close() {
          file.close();
          events.push('closed');
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
          async promote(stage, target, options) {
            try {
              return await actual.Stage.promote(stage, target, options);
            } catch (error) {
              if (!FsCapability.Rooted.Is.failure(error)) throw error;
              failure = error;
              events.push('owner-rejected');
              throw error;
            }
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
    get failure() {
      return failure;
    },
    get events(): readonly string[] {
      return [...events];
    },
  };
}
