import {
  createRooted,
  DEFAULT_IO,
  describe,
  expect,
  expectFailure,
  Fs,
  it,
  Num,
  setup,
  type t,
  teardown,
  withIo,
  wrapFile,
} from './u.fixture.ts';

const bytes = (value: string) => new TextEncoder().encode(value);

async function fileTarget(
  rooted: t.FsRooted.Instance,
  path: string,
): Promise<t.FsRooted.Target<'file'>> {
  const admission = await rooted.admit([{ kind: 'file', path }]);
  return admission.targets[0];
}

describe('Fs.Capability.Rooted.publishFile', () => {
  it('publishes complete synced bytes and removes its owned same-directory temp', async () => {
    const fixture = await setup();
    try {
      let temp = '';
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (options?.createNew === true) temp = path;
          return file;
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await fileTarget(rooted, 'docs/readme.md');
      const result = await rooted.publishFile(target, bytes('hello\n'));

      expect(result).to.eql({ kind: 'published', bytes: 6 });
      expect(await Deno.readTextFile(Fs.join(fixture.root, target.path))).to.eql('hello\n');
      expect(Fs.dirname(temp)).to.eql(Fs.join(rooted.path, 'docs'));
      expect(Fs.basename(temp).startsWith('.sys.rooted-tmp-')).to.eql(true);
      const names: string[] = [];
      for await (const entry of Deno.readDir(Fs.join(fixture.root, 'docs'))) names.push(entry.name);
      expect(names.some((name) => name.toLowerCase().startsWith('.sys.rooted-tmp-'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('publishes an empty complete value', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await fileTarget(rooted, 'empty.bin');
      expect(await rooted.publishFile(target, new Uint8Array())).to.eql({
        kind: 'published',
        bytes: 0,
      });
      expect((await Deno.lstat(Fs.join(fixture.root, 'empty.bin'))).size).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('never replaces an occupied file', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await fileTarget(rooted, 'immutable.txt');
      await Deno.writeTextFile(Fs.join(fixture.root, target.path), 'winner');

      await expectFailure(() => rooted.publishFile(target, bytes('loser')), 'occupied');
      expect(await Deno.readTextFile(Fs.join(fixture.root, target.path))).to.eql('winner');
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects a target handle from another rooted instance', async () => {
    const fixture = await setup();
    try {
      const a = await Fs.Capability.Rooted.create({ root: fixture.root });
      const b = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await fileTarget(a, 'foreign.txt');

      await expectFailure(() => b.publishFile(target, bytes('no')), 'foreign-handle');
      expect(await Fs.exists(Fs.join(fixture.root, 'foreign.txt'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('publishes exactly one file when concurrent Rooted writers race', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await fileTarget(rooted, 'race.txt');
      const settled = await Promise.allSettled([
        rooted.publishFile(target, bytes('alpha')),
        rooted.publishFile(target, bytes('bravo')),
      ]);

      expect(settled.filter((result) => result.status === 'fulfilled').length).to.eql(1);
      const rejected = settled.find((result) =>
        result.status === 'rejected'
      ) as PromiseRejectedResult;
      expect(Fs.Capability.Rooted.Is.failure(rejected.reason)).to.eql(true);
      expect((rejected.reason as t.FsRooted.Failure).kind).to.eql('occupied');
      expect(['alpha', 'bravo']).to.include(
        await Deno.readTextFile(Fs.join(fixture.root, target.path)),
      );
    } finally {
      await teardown(fixture);
    }
  });

  it('revalidates parent and final-target symlink state after admission', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const parentTarget = await fileTarget(rooted, 'parent/file.txt');
      await Deno.mkdir(fixture.outside, { recursive: true });
      await Deno.symlink(fixture.outside, Fs.join(fixture.root, 'parent'));
      await expectFailure(
        () => rooted.publishFile(parentTarget, bytes('no')),
        'unsafe-filesystem',
      );

      const finalTarget = await fileTarget(rooted, 'final.txt');
      const outsideFile = Fs.join(fixture.outside, 'outside.txt');
      await Deno.writeTextFile(outsideFile, 'outside');
      await Deno.symlink(outsideFile, Fs.join(fixture.root, 'final.txt'));
      await expectFailure(
        () => rooted.publishFile(finalTarget, bytes('no')),
        'unsafe-filesystem',
      );
      expect(await Deno.readTextFile(outsideFile)).to.eql('outside');
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels before publication without creating the target', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await fileTarget(rooted, 'cancelled.txt');
      const controller = new AbortController();
      controller.abort('stop');

      await expectFailure(
        () => rooted.publishFile(target, bytes('no'), { until: controller.signal }),
        'cancelled',
      );
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('publishes the bytes supplied at call time even if the caller mutates them during writing', async () => {
    const fixture = await setup();
    try {
      const source = bytes('stable');
      let mutated = false;
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!Fs.basename(path).startsWith('.sys.rooted-tmp-')) return file;
          return wrapFile(file, {
            write: async (data) => {
              const written = await file.write(data.subarray(0, Math.min(2, data.byteLength)));
              if (!mutated) {
                source.fill('x'.charCodeAt(0));
                mutated = true;
              }
              return written;
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await fileTarget(rooted, 'snapshot.txt');

      await rooted.publishFile(target, source);
      expect(await Deno.readTextFile(Fs.join(fixture.root, target.path))).to.eql('stable');
      expect(new TextDecoder().decode(source)).to.eql('xxxxxx');
    } finally {
      await teardown(fixture);
    }
  });

  it('retries short writes and rejects zero forward progress', async () => {
    const fixture = await setup();
    try {
      const shortIo = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!Fs.basename(path).startsWith('.sys.rooted-tmp-')) return file;
          return wrapFile(file, {
            write: (data) => file.write(data.subarray(0, Math.min(2, data.byteLength))),
          });
        },
      });
      const short = await createRooted({ root: fixture.root }, shortIo);
      const shortTarget = await fileTarget(short, 'short.txt');
      expect(await short.publishFile(shortTarget, bytes('complete'))).to.eql({
        kind: 'published',
        bytes: 8,
      });
      expect(await Deno.readTextFile(Fs.join(fixture.root, 'short.txt'))).to.eql('complete');

      const stalledIo = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!Fs.basename(path).startsWith('.sys.rooted-tmp-')) return file;
          return wrapFile(file, { write: () => Promise.resolve(0) });
        },
      });
      const stalled = await createRooted({ root: fixture.root }, stalledIo);
      const stalledTarget = await fileTarget(stalled, 'stalled.txt');
      await expectFailure(() => stalled.publishFile(stalledTarget, bytes('no')), 'io-failure');
      expect(await Fs.exists(Fs.join(fixture.root, 'stalled.txt'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects an untrustworthy temp identity without publishing or speculative cleanup', async () => {
    const fixture = await setup();
    try {
      let temp = '';
      let links = 0;
      let removals = 0;
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!Fs.basename(path).startsWith('.sys.rooted-tmp-')) return file;
          temp = path;
          return wrapFile(file, {
            stat: async () => ({ ...await file.stat(), ino: Num.INFINITY }),
          });
        },
        link: async (from, to) => {
          links++;
          await DEFAULT_IO.link(from, to);
        },
        remove: async (path, options) => {
          if (path === temp) removals++;
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await fileTarget(rooted, 'untrusted-temp.txt');

      await expectFailure(
        () => rooted.publishFile(target, bytes('no')),
        'unsupported',
      );
      expect(links).to.eql(0);
      expect(removals).to.eql(0);
      expect(await Fs.exists(temp)).to.eql(true);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('never cleans a temp path after its owned identity is replaced', async () => {
    const fixture = await setup();
    try {
      let temp = '';
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!Fs.basename(path).startsWith('.sys.rooted-tmp-')) return file;
          temp = path;
          return wrapFile(file, {
            sync: async () => {
              await file.sync();
              await Deno.rename(path, `${path}.owned`);
              await Deno.writeTextFile(path, 'foreign');
              throw new Error('sync-after-replacement');
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await fileTarget(rooted, 'identity-loss.txt');

      await expectFailure(
        () => rooted.publishFile(target, bytes('owned')),
        'ownership-lost',
      );
      expect(await Deno.readTextFile(temp)).to.eql('foreign');
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('fails closed on sync and hard-link failures', async () => {
    const fixture = await setup();
    try {
      const syncIo = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!Fs.basename(path).startsWith('.sys.rooted-tmp-')) return file;
          return wrapFile(file, { sync: async () => await Promise.reject(new Error('sync')) });
        },
      });
      const syncRooted = await createRooted({ root: fixture.root }, syncIo);
      const syncTarget = await fileTarget(syncRooted, 'sync.txt');
      await expectFailure(() => syncRooted.publishFile(syncTarget, bytes('no')), 'io-failure');
      expect(await Fs.exists(Fs.join(fixture.root, 'sync.txt'))).to.eql(false);

      const linkIo = withIo({
        link: async () => await Promise.reject(new Deno.errors.NotSupported('link')),
      });
      const linkRooted = await createRooted({ root: fixture.root }, linkIo);
      const linkTarget = await fileTarget(linkRooted, 'link.txt');
      await expectFailure(() => linkRooted.publishFile(linkTarget, bytes('no')), 'unsupported');
      expect(await Fs.exists(Fs.join(fixture.root, 'link.txt'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('sets committed when an untrustworthy target identity is observed after publication', async () => {
    const fixture = await setup();
    try {
      let published = '';
      const io = withIo({
        link: async (from, to) => {
          await DEFAULT_IO.link(from, to);
          published = to;
        },
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === published ? { ...info, ino: Num.MAX_INT + 1 } : info;
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await fileTarget(rooted, 'identity.txt');

      await expectFailure(
        () => rooted.publishFile(target, bytes('committed')),
        'unsafe-filesystem',
        true,
      );
      expect(await Deno.readTextFile(Fs.join(fixture.root, target.path))).to.eql('committed');
    } finally {
      await teardown(fixture);
    }
  });

  it('sets committed when cancellation or cleanup fails after hard-link publication', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      const cancelIo = withIo({
        link: async (from, to) => {
          await DEFAULT_IO.link(from, to);
          controller.abort('after-link');
        },
      });
      const cancelled = await createRooted({ root: fixture.root }, cancelIo);
      const cancelTarget = await fileTarget(cancelled, 'after-link.txt');
      await expectFailure(
        () => cancelled.publishFile(cancelTarget, bytes('committed'), { until: controller.signal }),
        'cancelled',
        true,
      );
      expect(await Deno.readTextFile(Fs.join(fixture.root, 'after-link.txt'))).to.eql('committed');

      const cleanupIo = withIo({
        remove: async (path, options) => {
          if (Fs.basename(path).startsWith('.sys.rooted-tmp-')) throw new Error('cleanup');
          await DEFAULT_IO.remove(path, options);
        },
      });
      const cleanup = await createRooted({ root: fixture.root }, cleanupIo);
      const cleanupTarget = await fileTarget(cleanup, 'cleanup.txt');
      await expectFailure(
        () => cleanup.publishFile(cleanupTarget, bytes('committed')),
        'io-failure',
        true,
      );
      expect(await Deno.readTextFile(Fs.join(fixture.root, 'cleanup.txt'))).to.eql('committed');
    } finally {
      await teardown(fixture);
    }
  });
});
