import { describe, expect, Hash, it, Num, StdPath } from '../../-test.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import { readPinnedPartWithIo } from '../u.verify/u.pinned.part.ts';
import { DEFAULT_IO, fixturePart, setup, teardown, withIo } from './-u.pinned.fixture.ts';

describe('Pkg.Dist.Pinned.readPart IO invariants', () => {
  it('snapshots exact own-key authority before filesystem work', async () => {
    const fixture = await setup();
    try {
      const args = fixturePart(fixture, 'assets/app.js');
      const expected = await Deno.readFile(StdPath.join(args.dir, args.path));
      let mutated = false;
      const io = withIo({
        lstat: async (path) => {
          if (!mutated) {
            mutated = true;
            args.dir = `${fixture.dir}/missing`;
            args.path = 'index.html';
            args.checksum = Hash.sha256('mutated');
            args.size = 0;
          }
          return await DEFAULT_IO.lstat(path);
        },
      });

      const result = await readPinnedPartWithIo(args, io);
      expect(result).to.eql({ kind: 'read', bytes: expected });
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects inherited, unknown, and malformed authority before filesystem work', async () => {
    const fixture = await setup();
    try {
      const valid = fixturePart(fixture, 'assets/app.js');
      const inherited = Object.assign(Object.create({ dir: valid.dir }), {
        path: valid.path,
        checksum: valid.checksum,
        size: valid.size,
      });
      const hidden = Object.defineProperty({ ...valid }, 'extra', { value: true });
      const symbol = { ...valid, [Symbol('extra')]: true };
      const invalid: readonly (readonly [name: string, input: unknown])[] = [
        ['unknown enumerable key', { ...valid, extra: true }],
        ['unknown non-enumerable key', hidden],
        ['unknown symbol key', symbol],
        ['inherited required key', inherited],
        [
          'missing required own key',
          { path: valid.path, checksum: valid.checksum, size: valid.size },
        ],
        ['noncanonical dot prefix', { ...valid, path: `./${valid.path}` }],
        ['noncanonical parent segment', { ...valid, path: `${valid.path}/..` }],
        ['noncanonical separator', { ...valid, path: valid.path.replace('/', '\\') }],
        ['reserved Rooted path', { ...valid, path: '.sys.rooted-private' }],
        ['packed checksum', { ...valid, checksum: `${valid.checksum}:size=${valid.size}` }],
        ['malformed checksum', { ...valid, checksum: 'sha256-nope' }],
        ['negative size', { ...valid, size: -1 }],
        ['fractional size', { ...valid, size: 1.5 }],
        ['infinite size', { ...valid, size: Number.POSITIVE_INFINITY }],
        ['malformed lifecycle', { ...valid, until: {} }],
      ];
      let calls = 0;
      const io = withIo({
        lstat: async (path) => {
          calls += 1;
          return await DEFAULT_IO.lstat(path);
        },
      });

      for (const [name, input] of invalid) {
        const result = await readPinnedPartWithIo(input, io);
        expect(result, name).to.eql({ kind: 'invalid-input' });
      }
      expect(calls).to.eql(0);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects final and ancestor symlinks', async () => {
    const finalFixture = await setup();
    const outsideFile = await Deno.makeTempFile({ prefix: 'Pkg.Dist.Pinned.readPart.outside.' });
    try {
      const part = fixturePart(finalFixture, 'assets/app.js');
      await Deno.writeFile(outsideFile, await Deno.readFile(StdPath.join(part.dir, part.path)));
      await Deno.remove(StdPath.join(part.dir, part.path));
      await Deno.symlink(outsideFile, StdPath.join(part.dir, part.path));
      const result = await Pkg.Dist.Pinned.readPart(part);
      expect(result).to.eql({ kind: 'symlink' });
    } finally {
      await Deno.remove(outsideFile);
      await teardown(finalFixture);
    }

    const ancestorFixture = await setup();
    const outsideDir = await Deno.makeTempDir({ prefix: 'Pkg.Dist.Pinned.readPart.ancestor.' });
    try {
      const part = fixturePart(ancestorFixture, 'assets/app.js');
      const bytes = await Deno.readFile(StdPath.join(part.dir, part.path));
      await Deno.writeFile(StdPath.join(outsideDir, 'app.js'), bytes);
      await Deno.remove(StdPath.join(part.dir, 'assets'), { recursive: true });
      await Deno.symlink(outsideDir, StdPath.join(part.dir, 'assets'));
      const result = await Pkg.Dist.Pinned.readPart(part);
      expect(result).to.eql({ kind: 'symlink' });
    } finally {
      await Deno.remove(outsideDir, { recursive: true });
      await teardown(ancestorFixture);
    }
  });

  it('detects final-target replacement before, during, and after reading', async () => {
    for (const transition of ['before', 'during', 'after'] as const) {
      const fixture = await setup();
      try {
        const part = fixturePart(fixture, 'assets/app.js');
        const target = StdPath.join(part.dir, part.path);
        const replacement = StdPath.join(part.dir, '.read-pinned-part-replacement');
        const bytes = await Deno.readFile(target);
        await Deno.writeFile(replacement, bytes);
        let replaced = false;
        const replace = async () => {
          if (replaced) return;
          replaced = true;
          await Deno.remove(target);
          await Deno.rename(replacement, target);
        };
        const io = withIo({
          open: async (path) => {
            if (path === target && transition === 'before') await replace();
            const handle = await DEFAULT_IO.open(path);
            if (path !== target || transition === 'before') return handle;
            let stats = 0;
            return {
              close: () => handle.close(),
              stat: async () => {
                const info = await handle.stat();
                stats += 1;
                if (transition === 'after' && stats === 2) await replace();
                return info;
              },
              read: async (buffer) => {
                const read = await handle.read(buffer);
                if (transition === 'during' && read !== null) await replace();
                return read;
              },
            };
          },
        });

        const result = await readPinnedPartWithIo(part, io);
        expect(result).to.eql({ kind: 'changed' });
      } finally {
        await teardown(fixture);
      }
    }
  });

  it('detects ancestor identity changes after reading', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const ancestor = StdPath.join(part.dir, 'assets');
      let observations = 0;
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          if (path !== ancestor) return info;
          if (!Num.Is.safeInt(info.ino)) throw new Error('Expected stable fixture inode');
          observations += 1;
          if (observations === 1) return info;
          const ino = info.ino === Num.MAX_INT ? info.ino - 1 : info.ino + 1;
          return { ...info, ino };
        },
      });

      const result = await readPinnedPartWithIo(part, io);
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('fails closed when stable metadata is unavailable', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const target = StdPath.join(part.dir, part.path);
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === target
            ? { ...info, dev: undefined, ino: undefined } as unknown as Deno.FileInfo
            : info;
        },
      });
      const result = await readPinnedPartWithIo(part, io);
      expect(result).to.eql({ kind: 'unsupported' });
    } finally {
      await teardown(fixture);
    }
  });

  it('latches pre- and mid-read cancellation and closes the handle', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const before = new AbortController();
      before.abort('before');
      const preCancelled = await Pkg.Dist.Pinned.readPart({ ...part, until: before.signal });
      expect(preCancelled).to.eql({ kind: 'cancelled' });

      const during = new AbortController();
      const target = StdPath.join(part.dir, part.path);
      let closed = 0;
      const io = withIo({
        open: async (path) => {
          const handle = await DEFAULT_IO.open(path);
          if (path !== target) return handle;
          return {
            close: () => {
              closed += 1;
              handle.close();
            },
            stat: () => handle.stat(),
            read: async (buffer) => {
              const read = await handle.read(buffer.subarray(0, 1));
              during.abort('during');
              return read;
            },
          };
        },
      });
      const midCancelled = await readPinnedPartWithIo({ ...part, until: during.signal }, io);
      expect(midCancelled).to.eql({ kind: 'cancelled' });
      expect(closed).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('requires the exact bytes followed by one EOF probe', async () => {
    for (const readShape of ['short', 'trailing'] as const) {
      const fixture = await setup();
      try {
        const part = fixturePart(fixture, 'assets/app.js');
        const target = StdPath.join(part.dir, part.path);
        const io = withIo({
          open: async (path) => {
            const handle = await DEFAULT_IO.open(path);
            if (path !== target) return handle;
            let loaded = 0;
            return {
              close: () => handle.close(),
              stat: () => handle.stat(),
              read: async (buffer) => {
                if (readShape === 'short' && loaded > 0) return null;
                if (readShape === 'trailing' && loaded === part.size) return 1;
                const input = readShape === 'short' ? buffer.subarray(0, 1) : buffer;
                const read = await handle.read(input);
                if (read !== null) loaded += read;
                return read;
              },
            };
          },
        });
        const result = await readPinnedPartWithIo(part, io);
        expect(result).to.eql({ kind: 'changed' });
      } finally {
        await teardown(fixture);
      }
    }
  });

  it('maps host failures without exposing local paths or raw causes', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const target = StdPath.join(part.dir, part.path);
      const io = withIo({
        open: async (path) => {
          if (path === target) throw new Error(`private path: ${path}`);
          return await DEFAULT_IO.open(path);
        },
      });
      const result = await readPinnedPartWithIo(part, io);
      expect(result).to.eql({ kind: 'io-failure' });
      expect(Object.keys(result)).to.eql(['kind']);
      expect(JSON.stringify(result).includes(fixture.dir)).to.eql(false);
      expect(Object.isFrozen(result)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves the first read failure when close also fails', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const target = StdPath.join(part.dir, part.path);
      const io = withIo({
        open: async (path) => {
          const handle = await DEFAULT_IO.open(path);
          if (path !== target) return handle;
          return {
            stat: () => handle.stat(),
            read: () => Promise.resolve(null),
            close: () => {
              handle.close();
              throw new Deno.errors.NotSupported('close failed');
            },
          };
        },
      });
      const result = await readPinnedPartWithIo(part, io);
      expect(result).to.eql({ kind: 'changed' });
    } finally {
      await teardown(fixture);
    }
  });

  it('classifies an unallocatable maximum safe size as limit-exceeded', async () => {
    const fixture = await setup();
    try {
      const part = fixturePart(fixture, 'assets/app.js');
      const target = StdPath.join(part.dir, part.path);
      let closed = 0;
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === target ? { ...info, size: Num.MAX_INT } : info;
        },
        open: async (path) => {
          const handle = await DEFAULT_IO.open(path);
          if (path !== target) return handle;
          return {
            close: () => {
              closed += 1;
              handle.close();
            },
            read: (buffer) => handle.read(buffer),
            stat: async () => ({ ...(await handle.stat()), size: Num.MAX_INT }),
          };
        },
      });
      const result = await readPinnedPartWithIo({ ...part, size: Num.MAX_INT }, io);
      expect(result).to.eql({ kind: 'limit-exceeded' });
      expect(closed).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });
});
