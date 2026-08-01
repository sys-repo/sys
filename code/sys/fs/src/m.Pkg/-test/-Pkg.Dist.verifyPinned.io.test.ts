import { describe, expect, it, StdPath } from '../../-test.ts';
import { Pkg } from '../mod.ts';
import { verifyPinnedWithIo } from '../u.verify/u.pinned.ts';
import { DEFAULT_IO, limits, setup, teardown, withIo } from './-u.verifyPinned.fixture.ts';

describe('Pkg.Dist.verifyPinned operation truth', () => {
  it('returns cancelled before work, during enumeration, and at the final boundary', async () => {
    const fixture = await setup();
    try {
      const before = new AbortController();
      before.abort('before');
      const cancelled = await Pkg.Dist.verifyPinned({
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits,
        until: before.signal,
      });
      expect(cancelled).to.eql({ kind: 'cancelled' });

      const during = new AbortController();
      const io = withIo({
        readDir(path) {
          const source = DEFAULT_IO.readDir(path);
          return (async function* () {
            for await (const entry of source) {
              during.abort('during-enumeration');
              yield entry;
            }
          })();
        },
      });
      const enumerating = await verifyPinnedWithIo(
        {
          dir: fixture.dir,
          integrity: fixture.integrity,
          limits,
          until: during.signal,
        },
        io,
      );
      expect(enumerating).to.eql({ kind: 'cancelled' });

      const final = new AbortController();
      let manifestOpens = 0;
      const finalIo = withIo({
        open: async (path) => {
          const handle = await DEFAULT_IO.open(path);
          const finalManifest = path === StdPath.join(fixture.dir, 'dist.json') &&
            ++manifestOpens === 2;
          return {
            close: () => handle.close(),
            stat: () => handle.stat(),
            read: async (buffer) => {
              const read = await handle.read(buffer);
              if (finalManifest && read === null) final.abort('final-boundary');
              return read;
            },
          };
        },
      });
      const finishing = await verifyPinnedWithIo(
        {
          dir: fixture.dir,
          integrity: fixture.integrity,
          limits,
          until: final.signal,
        },
        finalIo,
      );
      expect(finishing).to.eql({ kind: 'cancelled' });
    } finally {
      await teardown(fixture);
    }
  });

  it('snapshots caller limits before filesystem work', async () => {
    const fixture = await setup();
    try {
      const args = {
        dir: fixture.dir,
        integrity: fixture.integrity,
        limits: { ...limits },
      };
      let mutated = false;
      const io = withIo({
        lstat: async (path) => {
          if (!mutated) {
            mutated = true;
            args.limits.entries = 1;
          }
          return await DEFAULT_IO.lstat(path);
        },
      });
      const result = await verifyPinnedWithIo(args, io);
      expect(result.kind).to.eql('verified');
    } finally {
      await teardown(fixture);
    }
  });

  it('fails closed when stable filesystem identity is unavailable', async () => {
    const fixture = await setup();
    try {
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return { ...info, dev: undefined, ino: undefined } as unknown as Deno.FileInfo;
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'unsupported' });
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects invalid numeric filesystem identity and timestamps as unsupported', async () => {
    const variants = [
      (info: Deno.FileInfo) => ({ ...info, dev: Number.POSITIVE_INFINITY }),
      (info: Deno.FileInfo) => ({ ...info, ino: 1.5 }),
      (info: Deno.FileInfo) => ({ ...info, mtime: new Date(Number.NaN) }),
    ];

    for (const mutate of variants) {
      const fixture = await setup();
      try {
        const io = withIo({
          lstat: async (path) => mutate(await DEFAULT_IO.lstat(path)),
        });
        const result = await verifyPinnedWithIo(
          { dir: fixture.dir, integrity: fixture.integrity, limits },
          io,
        );
        expect(result).to.eql({ kind: 'unsupported' });
      } finally {
        await teardown(fixture);
      }
    }
  });

  it('detects asset mutation between the two tree observations', async () => {
    const fixture = await setup();
    try {
      let rootReads = 0;
      const io = withIo({
        readDir(path) {
          const source = DEFAULT_IO.readDir(path);
          return (async function* () {
            if (path === fixture.dir) {
              rootReads += 1;
              if (rootReads === 2) {
                await Deno.writeTextFile(
                  StdPath.join(fixture.dir, 'assets', 'app.js'),
                  'changed-after-hash',
                );
              }
            }
            for await (const entry of source) yield entry;
          })();
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('classifies a symlink replacement during the second tree observation as changed', async () => {
    const fixture = await setup();
    const outside = await Deno.makeTempFile({ prefix: 'Pkg.Dist.verifyPinned.changed-link.' });
    try {
      let rootReads = 0;
      const io = withIo({
        readDir(path) {
          const source = DEFAULT_IO.readDir(path);
          return (async function* () {
            if (path === fixture.dir && ++rootReads === 2) {
              const asset = StdPath.join(fixture.dir, 'assets', 'app.js');
              await Deno.remove(asset);
              await Deno.symlink(outside, asset);
            }
            for await (const entry of source) yield entry;
          })();
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
      await Deno.remove(outside);
    }
  });

  it('classifies a new entry during the second tree observation as changed', async () => {
    const fixture = await setup();
    try {
      let rootReads = 0;
      const io = withIo({
        readDir(path) {
          const source = DEFAULT_IO.readDir(path);
          return (async function* () {
            if (path === fixture.dir && ++rootReads === 2) {
              await Deno.writeTextFile(StdPath.join(fixture.dir, 'late.txt'), 'late');
            }
            for await (const entry of source) yield entry;
          })();
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('prioritizes an authenticated manifest transition over generic tree failures', async () => {
    for (const transition of ['symlink', 'missing-with-extra'] as const) {
      const fixture = await setup();
      const outside = await Deno.makeTempFile({
        prefix: 'Pkg.Dist.verifyPinned.manifest-transition.',
      });
      try {
        let mutated = false;
        const io = withIo({
          readDir(path) {
            if (path !== fixture.dir || mutated) return DEFAULT_IO.readDir(path);
            mutated = true;
            return (async function* () {
              await Deno.remove(StdPath.join(fixture.dir, 'dist.json'));
              const link = StdPath.join(
                fixture.dir,
                transition === 'symlink' ? 'dist.json' : '.early-link',
              );
              await Deno.symlink(outside, link);
              for await (const entry of DEFAULT_IO.readDir(path)) yield entry;
            })();
          },
        });
        const result = await verifyPinnedWithIo(
          { dir: fixture.dir, integrity: fixture.integrity, limits },
          io,
        );
        expect(result).to.eql({ kind: 'changed' });
      } finally {
        await teardown(fixture);
        await Deno.remove(outside);
      }
    }
  });

  it('classifies disappearance after an observation as changed', async () => {
    const manifestFixture = await setup();
    try {
      let removed = false;
      const io = withIo({
        readDir(path) {
          const source = DEFAULT_IO.readDir(path);
          return (async function* () {
            if (path === manifestFixture.dir && !removed) {
              removed = true;
              await Deno.remove(StdPath.join(manifestFixture.dir, 'dist.json'));
            }
            for await (const entry of source) yield entry;
          })();
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: manifestFixture.dir, integrity: manifestFixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(manifestFixture);
    }

    const assetFixture = await setup();
    try {
      const asset = StdPath.join(assetFixture.dir, 'assets', 'app.js');
      let observations = 0;
      const io = withIo({
        lstat: async (path) => {
          if (path === asset && ++observations === 2) await Deno.remove(asset);
          return await DEFAULT_IO.lstat(path);
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: assetFixture.dir, integrity: assetFixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(assetFixture);
    }

    const openFixture = await setup();
    try {
      const asset = StdPath.join(openFixture.dir, 'assets', 'app.js');
      const io = withIo({
        open: async (path) => {
          if (path === asset) await Deno.remove(asset);
          return await DEFAULT_IO.open(path);
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: openFixture.dir, integrity: openFixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(openFixture);
    }
  });

  it('classifies kind or symlink replacement after the first tree observation as changed', async () => {
    for (const replacement of ['directory', 'symlink'] as const) {
      const fixture = await setup();
      const outside = await Deno.makeTempFile({ prefix: 'Pkg.Dist.verifyPinned.replacement.' });
      try {
        const asset = StdPath.join(fixture.dir, 'assets', 'app.js');
        let observations = 0;
        const io = withIo({
          lstat: async (path) => {
            if (path === asset && ++observations === 2) {
              await Deno.remove(asset);
              if (replacement === 'directory') await Deno.mkdir(asset);
              if (replacement === 'symlink') await Deno.symlink(outside, asset);
            }
            return await DEFAULT_IO.lstat(path);
          },
        });
        const result = await verifyPinnedWithIo(
          { dir: fixture.dir, integrity: fixture.integrity, limits },
          io,
        );
        expect(result).to.eql({ kind: 'changed' });
      } finally {
        await teardown(fixture);
        await Deno.remove(outside);
      }
    }
  });

  it('classifies root re-observation and queued-directory invalidation as changed', async () => {
    for (const replacement of ['missing', 'file'] as const) {
      const fixture = await setup();
      try {
        let observations = 0;
        const io = withIo({
          lstat: async (path) => {
            if (path === fixture.dir && ++observations === 2) {
              if (replacement === 'missing') {
                throw new Deno.errors.NotFound('root disappeared');
              }
              const info = await DEFAULT_IO.lstat(path);
              return { ...info, isDirectory: false, isFile: true };
            }
            return await DEFAULT_IO.lstat(path);
          },
        });
        const result = await verifyPinnedWithIo(
          { dir: fixture.dir, integrity: fixture.integrity, limits },
          io,
        );
        expect(result).to.eql({ kind: 'changed' });
      } finally {
        await teardown(fixture);
      }
    }

    for (
      const cause of [
        new Deno.errors.NotFound('directory disappeared'),
        new Deno.errors.NotADirectory('directory replaced'),
      ]
    ) {
      const fixture = await setup();
      try {
        const io = withIo({
          readDir(path) {
            if (path === StdPath.join(fixture.dir, 'assets')) throw cause;
            return DEFAULT_IO.readDir(path);
          },
        });
        const result = await verifyPinnedWithIo(
          { dir: fixture.dir, integrity: fixture.integrity, limits },
          io,
        );
        expect(result).to.eql({ kind: 'changed' });
      } finally {
        await teardown(fixture);
      }
    }
  });

  it('classifies root invalidation during canonicalization as changed', async () => {
    for (
      const cause of [
        new Deno.errors.NotFound('root disappeared'),
        new Deno.errors.NotADirectory('root replaced'),
      ]
    ) {
      const fixture = await setup();
      try {
        const io = withIo({ realPath: () => Promise.reject(cause) });
        const result = await verifyPinnedWithIo(
          { dir: fixture.dir, integrity: fixture.integrity, limits },
          io,
        );
        expect(result).to.eql({ kind: 'changed' });
      } finally {
        await teardown(fixture);
      }
    }
  });

  it('detects final manifest replacement after the second tree observation', async () => {
    const fixture = await setup();
    try {
      let manifestOpens = 0;
      const io = withIo({
        open: async (path) => {
          if (path === StdPath.join(fixture.dir, 'dist.json')) {
            manifestOpens += 1;
            if (manifestOpens === 2) {
              const bytes = await Deno.readFile(path);
              const changed = new Uint8Array(bytes.byteLength + 1);
              changed.set(bytes);
              changed[changed.length - 1] = 0x20;
              await Deno.writeFile(path, changed);
            }
          }
          return await DEFAULT_IO.open(path);
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('detects an opened asset handle that stops before the expected bytes', async () => {
    const fixture = await setup();
    try {
      const io = withIo({
        open: async (path) => {
          const handle = await DEFAULT_IO.open(path);
          if (path !== StdPath.join(fixture.dir, 'assets', 'app.js')) return handle;
          let stopped = false;
          return {
            close: () => handle.close(),
            stat: () => handle.stat(),
            read: async (buffer) => {
              if (!stopped) {
                stopped = true;
                return null;
              }
              return await handle.read(buffer);
            },
          };
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves an observed change when closing the same handle also fails', async () => {
    const fixture = await setup();
    try {
      const io = withIo({
        open: async (path) => {
          const handle = await DEFAULT_IO.open(path);
          if (path !== StdPath.join(fixture.dir, 'assets', 'app.js')) return handle;
          return {
            read: async () => null,
            stat: () => handle.stat(),
            close: () => {
              handle.close();
              throw new Deno.errors.NotSupported('close failed');
            },
          };
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('maps host failures without exposing paths or raw causes', async () => {
    const fixture = await setup();
    try {
      const enumerationIo = withIo({
        readDir: () => {
          throw new Error('enumeration failed');
        },
      });
      const enumeration = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        enumerationIo,
      );
      expect(enumeration).to.eql({ kind: 'io-failure' });

      const closeIo = withIo({
        open: async (path) => {
          const handle = await DEFAULT_IO.open(path);
          if (path !== StdPath.join(fixture.dir, 'assets', 'app.js')) return handle;
          return {
            read: (buffer) => handle.read(buffer),
            stat: () => handle.stat(),
            close: () => {
              handle.close();
              throw new Deno.errors.NotSupported('close failed');
            },
          };
        },
      });
      const close = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        closeIo,
      );
      expect(close).to.eql({ kind: 'io-failure' });

      const io = withIo({
        open: async (path) => {
          if (path === StdPath.join(fixture.dir, 'assets', 'app.js')) {
            throw new Error(`private path: ${path}`);
          }
          return await DEFAULT_IO.open(path);
        },
      });
      const result = await verifyPinnedWithIo(
        { dir: fixture.dir, integrity: fixture.integrity, limits },
        io,
      );
      expect(result).to.eql({ kind: 'io-failure' });
      expect(Object.keys(result)).to.eql(['kind']);
      expect(JSON.stringify(result).includes(fixture.dir)).to.eql(false);
      expect(Object.isFrozen(result)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });
});
