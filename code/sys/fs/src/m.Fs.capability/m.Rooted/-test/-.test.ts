import {
  createRooted,
  DEFAULT_IO,
  describe,
  expect,
  expectFailure,
  expectTypeOf,
  Fs,
  type Io,
  it,
  Num,
  setup,
  type t,
  teardown,
  withIo,
} from './u.fixture.ts';
import { Rooted } from '../mod.ts';

describe('Fs.Capability.Rooted: public surface', () => {
  it('exports the frozen public capability surface', async () => {
    const module = await import('@sys/fs/capability');

    expect(module.FsCapability.Rooted).to.equal(Rooted);
    expect(Fs.Capability.Rooted).to.equal(Rooted);
    expect(Object.keys(Rooted).sort()).to.eql(['Is', 'create']);
    expect(Object.isFrozen(Rooted)).to.eql(true);
    expect(Object.isFrozen(Rooted.Is)).to.eql(true);
    expectTypeOf(Rooted).toEqualTypeOf<t.FsRooted.Lib>();
  });

  it('creates an asynchronous capability at one canonical real directory', async () => {
    const fixture = await setup();
    try {
      const rooted = await Rooted.create({ root: fixture.root });
      expect(Object.keys(rooted).sort()).to.eql([
        'acquireLease',
        'admit',
        'createStage',
        'discardStage',
        'inspectSeal',
        'path',
        'promoteStage',
        'publishFile',
        'removeTree',
        'sealTree',
      ]);
      expect(rooted.path).to.eql(await Deno.realPath(fixture.root));
      expect((await Deno.lstat(rooted.path)).isDirectory).to.eql(true);
      expectTypeOf(rooted).toEqualTypeOf<t.FsRooted.Instance>();
      expectTypeOf(rooted).toEqualTypeOf<t.Fs.Rooted.Instance>();
    } finally {
      await teardown(fixture);
    }
  });

  it('binds an existing canonical root without requesting ambient ancestor reads', async () => {
    const fixture = await setup();
    try {
      await Deno.mkdir(fixture.root, { recursive: true });
      const canonical = await Deno.realPath(fixture.root);
      const observed: string[] = [];
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          lstat: async (path) => {
            observed.push(path);
            if (path !== fixture.root && path !== canonical) {
              throw new Error(`Unexpected ancestor read: ${path}`);
            }
            return await DEFAULT_IO.lstat(path);
          },
        }),
      );

      expect(rooted.path).to.eql(canonical);
      expect(observed).to.eql([fixture.root, canonical]);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves file and directory kinds so mixed target handles narrow by kind', async () => {
    const fixture = await setup();
    try {
      const rooted = await Rooted.create({ root: fixture.root });
      const files = await rooted.admit([{ kind: 'file', path: 'file.txt' }]);
      expectTypeOf(files.targets[0]).toEqualTypeOf<t.FsRooted.Target<'file'>>();

      const mixed = await rooted.admit([
        { kind: 'file', path: 'asset.js' },
        { kind: 'directory', path: 'generation' },
      ]);
      expectTypeOf(mixed.targets).toEqualTypeOf<
        readonly (t.FsRooted.Target<'file'> | t.FsRooted.Target<'directory'>)[]
      >();

      const target = mixed.targets[0];
      if (target.kind === 'file') {
        expectTypeOf(target).toEqualTypeOf<t.FsRooted.Target<'file'>>();
      } else {
        expectTypeOf(target).toEqualTypeOf<t.FsRooted.Target<'directory'>>();
      }
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted: canonical root identity', () => {
  it('snapshots exact creation authority before filesystem observation', async () => {
    const fixture = await setup();
    try {
      let observations = 0;
      const io = withIo({
        lstat: async (path) => {
          observations += 1;
          return await DEFAULT_IO.lstat(path);
        },
      });
      const invoke = (options: unknown) => {
        const create = createRooted as unknown as (
          input: unknown,
          operations: Io,
        ) => Promise<t.FsRooted.Instance>;
        return create(options, io);
      };
      let getterCalls = 0;
      const accessor = Object.defineProperty({ root: fixture.root }, 'create', {
        get() {
          getterCalls += 1;
          return true;
        },
      });
      const inherited = Object.create({ root: fixture.root });
      const proxied = new Proxy({ root: fixture.root }, {});
      const revoked = Proxy.revocable({ root: fixture.root }, {});
      revoked.revoke();

      for (
        const input of [
          { root: fixture.root, unexpected: true },
          inherited,
          accessor,
          proxied,
          revoked.proxy,
        ]
      ) {
        const failure = await expectFailure(() => invoke(input), 'invalid-options');
        expect(failure.operation).to.eql('create');
      }
      expect(getterCalls).to.eql(0);
      expect(observations).to.eql(0);
      expect(await Fs.exists(fixture.root)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects replacement while establishing the canonical root identity', async () => {
    const fixture = await setup();
    try {
      const moved = Fs.join(fixture.workspace, 'selected-root');
      let replaced = false;
      const io = withIo({
        realPath: async (path) => {
          if (path === fixture.root && !replaced) {
            replaced = true;
            await Deno.rename(path, moved);
            await Deno.mkdir(path);
          }
          return await DEFAULT_IO.realPath(path);
        },
      });

      await expectFailure(() => createRooted({ root: fixture.root }, io), 'invalid-root');
    } finally {
      await teardown(fixture);
    }
  });

  it('fails closed when root identity is unavailable or untrustworthy', async () => {
    const fixture = await setup();
    try {
      const invalid = [null, -1, 0.5, Num.INFINITY, Num.MAX_INT + 1] as const;
      for (const field of ['dev', 'ino'] as const) {
        for (const value of invalid) {
          const io = withIo({
            lstat: async (path) => {
              const info = await DEFAULT_IO.lstat(path);
              return path === fixture.root ? { ...info, [field]: value } : info;
            },
          });

          await expectFailure(() => createRooted({ root: fixture.root }, io), 'unsupported');
        }
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('accepts safe non-negative root identity boundaries', async () => {
    const fixture = await setup();
    try {
      for (const field of ['dev', 'ino'] as const) {
        for (const value of [0, Num.MAX_INT]) {
          const io = withIo({
            lstat: async (path) => {
              const info = await DEFAULT_IO.lstat(path);
              return path === fixture.root ? { ...info, [field]: value } : info;
            },
          });

          const rooted = await createRooted({ root: fixture.root }, io);
          expect(rooted.path).to.eql(await Deno.realPath(fixture.root));
        }
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('can require an existing root without mutating an absent selection', async () => {
    const fixture = await setup();
    try {
      await expectFailure(
        () => Rooted.create({ root: fixture.root, create: false }),
        'invalid-root',
      );
      expect(await Fs.exists(fixture.root)).to.eql(false);

      await Deno.mkdir(fixture.root);
      const rooted = await Rooted.create({ root: fixture.root, create: false });
      expect(rooted.path).to.eql(await Deno.realPath(fixture.root));
    } finally {
      await teardown(fixture);
    }
  });

  it('does not create missing authority above the selected root', async () => {
    const fixture = await setup();
    try {
      const parent = Fs.join(fixture.workspace, 'missing-parent');
      const root = Fs.join(parent, 'root');
      await expectFailure(() => Rooted.create({ root }), 'invalid-root');
      expect(await Fs.exists(parent)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });
});
