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
  wrapReadHandle,
} from './u.fixture.ts';

const encode = (value: string) => new TextEncoder().encode(value);
const decode = (value: Uint8Array) => new TextDecoder().decode(value);
const READ_OPTIONS: t.FsRooted.ReadFileOptions = Object.freeze({ maxBytes: 1024 });

async function fileTarget(
  rooted: t.FsRooted.Instance,
  path: string,
): Promise<t.FsRooted.Target<'file'>> {
  const admission = await rooted.admit([{ kind: 'file', path }]);
  const target = admission.targets[0];
  if (!target) throw new Error('Expected admitted file target.');
  return target;
}

async function expectRead(
  rooted: t.FsRooted.Instance,
  target: t.FsRooted.Target<'file'>,
  expected: string,
): Promise<void> {
  const result = await rooted.readFile(target, READ_OPTIONS);
  expect(result.kind).to.eql('read');
  if (result.kind === 'read') expect(decode(result.bytes)).to.eql(expected);
}

describe('Fs.Capability.Rooted.readFile', () => {
  describe('observable read contract', () => {
    it('reads current regular-file bytes without authenticating them', async () => {
      const fixture = await setup();
      try {
        const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
        const path = Fs.join(fixture.root, 'asset.txt');
        await Deno.writeFile(path, encode('first'));
        const target = await fileTarget(rooted, 'asset.txt');

        await expectRead(rooted, target, 'first');
        await Deno.writeFile(path, encode('changed'));
        await expectRead(rooted, target, 'changed');
      } finally {
        await teardown(fixture);
      }
    });

    it('returns absent only when the admitted path is missing when checked', async () => {
      const fixture = await setup();
      try {
        const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
        const target = await fileTarget(rooted, 'missing.txt');
        expect(await rooted.readFile(target, READ_OPTIONS)).to.eql({ kind: 'absent' });

        await Deno.writeTextFile(Fs.join(fixture.root, target.path), 'present');
        await expectRead(rooted, target, 'present');
        await Deno.remove(Fs.join(fixture.root, target.path));
        expect(await rooted.readFile(target, READ_OPTIONS)).to.eql({ kind: 'absent' });
      } finally {
        await teardown(fixture);
      }
    });
  });

  describe('authority and bounded input', () => {
    it('enforces a safe allocation bound before reading bytes', async () => {
      const fixture = await setup();
      try {
        const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
        await Deno.writeTextFile(Fs.join(fixture.root, 'asset.txt'), 'declared');
        const target = await fileTarget(rooted, 'asset.txt');
        await expectFailure(
          () => rooted.readFile(target, { maxBytes: 7 }),
          'limit-exceeded',
        );

        const unallocatable = await createRooted(
          { root: fixture.root },
          withIo({
            lstat: async (path) => {
              const info = await DEFAULT_IO.lstat(path);
              return Fs.basename(path) === 'asset.txt' ? { ...info, size: Num.MAX_INT } : info;
            },
            openRead: async (path) => {
              const file = await DEFAULT_IO.openRead(path);
              return wrapReadHandle(file, {
                stat: async () => ({ ...await file.stat(), size: Num.MAX_INT }),
              });
            },
          }),
        );
        const unallocatableTarget = await fileTarget(unallocatable, 'asset.txt');
        await expectFailure(
          () => unallocatable.readFile(unallocatableTarget, { maxBytes: Num.MAX_INT }),
          'limit-exceeded',
        );
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects malformed read options before target observation', async () => {
      const fixture = await setup();
      try {
        let targetObservations = 0;
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            lstat: async (path) => {
              targetObservations += 1;
              return await DEFAULT_IO.lstat(path);
            },
          }),
        );
        const target = await fileTarget(rooted, 'asset.txt');
        targetObservations = 0;

        const invoke = (options: unknown) => {
          const read = rooted.readFile as unknown as (
            target: t.FsRooted.Target<'file'>,
            options: unknown,
          ) => Promise<t.FsRooted.ReadFileResult>;
          return read(target, options);
        };
        const inherited = Object.create({ maxBytes: 1024 });
        const accessor = Object.defineProperty({}, 'maxBytes', {
          get() {
            throw new Error('maxBytes accessor invoked');
          },
        });
        const revoked = Proxy.revocable({}, {});
        revoked.revoke();
        for (
          const input of [
            undefined,
            {},
            { maxBytes: -1 },
            { maxBytes: 1024, residue: true },
            inherited,
            accessor,
            revoked.proxy,
          ]
        ) {
          await expectFailure(() => invoke(input), 'invalid-options');
        }
        expect(targetObservations).to.eql(0);
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects target handles from another Rooted instance', async () => {
      const fixture = await setup();
      try {
        const first = await Fs.Capability.Rooted.create({ root: fixture.root });
        const second = await Fs.Capability.Rooted.create({ root: fixture.root });
        const target = await fileTarget(first, 'file.txt');

        await expectFailure(
          () => second.readFile(target, READ_OPTIONS),
          'foreign-handle',
        );
      } finally {
        await teardown(fixture);
      }
    });
  });

  describe('cancellation and descriptor ownership', () => {
    it('rejects an already cancelled operation', async () => {
      const fixture = await setup();
      try {
        const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
        const target = await fileTarget(rooted, 'file.txt');
        const controller = new AbortController();
        controller.abort('stop');

        await expectFailure(
          () => rooted.readFile(target, { ...READ_OPTIONS, until: controller.signal }),
          'cancelled',
        );
      } finally {
        await teardown(fixture);
      }
    });

    it('honors cancellation after final target observation before settling or opening', async () => {
      for (const present of [false, true]) {
        const fixture = await setup();
        try {
          const controller = new AbortController();
          let abortAtFinalObservation = false;
          let opened = false;
          const path = Fs.join(fixture.root, 'asset.txt');
          const rooted = await createRooted(
            { root: fixture.root },
            withIo({
              lstat: async (selected) => {
                if (abortAtFinalObservation && selected === path) {
                  controller.abort('final-observation');
                }
                return await DEFAULT_IO.lstat(selected);
              },
              openRead: async (selected) => {
                opened = true;
                return await DEFAULT_IO.openRead(selected);
              },
            }),
          );
          if (present) await Deno.writeTextFile(path, 'declared');
          const target = await fileTarget(rooted, 'asset.txt');
          abortAtFinalObservation = true;

          const failure = await expectFailure(
            () => rooted.readFile(target, { ...READ_OPTIONS, until: controller.signal }),
            'cancelled',
          );
          expect(failure.operation).to.eql('read-file');
          expect(opened).to.eql(false);
        } finally {
          await teardown(fixture);
        }
      }
    });

    it('closes exactly one descriptor when cancellation interrupts a read', async () => {
      const fixture = await setup();
      try {
        const controller = new AbortController();
        let closed = 0;
        let cancelled = false;
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            openRead: async (path) => {
              const file = await DEFAULT_IO.openRead(path);
              return wrapReadHandle(file, {
                read: async (bytes) => {
                  const length = await file.read(bytes);
                  if (!cancelled && length !== null) {
                    cancelled = true;
                    controller.abort('during-read');
                  }
                  return length;
                },
                close: async () => {
                  closed += 1;
                  await file.close();
                },
              });
            },
          }),
        );
        await Deno.writeTextFile(Fs.join(fixture.root, 'asset.txt'), 'declared');
        const target = await fileTarget(rooted, 'asset.txt');

        const failure = await expectFailure(
          () => rooted.readFile(target, { ...READ_OPTIONS, until: controller.signal }),
          'cancelled',
        );
        expect(failure.operation).to.eql('read-file');
        expect(closed).to.eql(1);
      } finally {
        await teardown(fixture);
      }
    });
  });

  describe('path and descriptor identity', () => {
    it('rejects final and ancestor symlink replacement without exposing outside bytes', async () => {
      const fixture = await setup();
      try {
        await Deno.mkdir(fixture.outside, { recursive: true });
        const outside = Fs.join(fixture.outside, 'private.txt');
        await Deno.writeTextFile(outside, 'private');
        const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });

        const finalPath = Fs.join(fixture.root, 'final.txt');
        await Deno.writeTextFile(finalPath, 'declared');
        const finalTarget = await fileTarget(rooted, 'final.txt');
        await Deno.remove(finalPath);
        await Deno.symlink(outside, finalPath);
        await expectFailure(
          () => rooted.readFile(finalTarget, READ_OPTIONS),
          'unsafe-filesystem',
        );

        await Deno.mkdir(Fs.join(fixture.root, 'assets'));
        await Deno.writeTextFile(Fs.join(fixture.root, 'assets/entry.txt'), 'declared');
        const ancestorTarget = await fileTarget(rooted, 'assets/entry.txt');
        await Deno.remove(Fs.join(fixture.root, 'assets'), { recursive: true });
        await Deno.symlink(fixture.outside, Fs.join(fixture.root, 'assets'));
        await expectFailure(
          () => rooted.readFile(ancestorTarget, READ_OPTIONS),
          'unsafe-filesystem',
        );
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects rooted directory replacement after admission', async () => {
      const fixture = await setup();
      try {
        const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
        await Deno.writeTextFile(Fs.join(fixture.root, 'asset.txt'), 'declared');
        const target = await fileTarget(rooted, 'asset.txt');
        await Deno.rename(fixture.root, Fs.join(fixture.workspace, 'moved-root'));
        await Deno.mkdir(fixture.root);
        await Deno.writeTextFile(Fs.join(fixture.root, 'asset.txt'), 'foreign');

        await expectFailure(
          () => rooted.readFile(target, READ_OPTIONS),
          'unsafe-filesystem',
        );
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects final-entry replacement between observation and descriptor acquisition', async () => {
      const fixture = await setup();
      try {
        await Deno.mkdir(fixture.outside, { recursive: true });
        const outside = Fs.join(fixture.outside, 'private.txt');
        await Deno.writeTextFile(outside, 'private');
        const path = Fs.join(fixture.root, 'asset.txt');
        await Deno.mkdir(fixture.root);
        await Deno.writeTextFile(path, 'declared');
        let replaced = false;
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            openRead: async (selected) => {
              if (!replaced) {
                replaced = true;
                await Deno.rename(selected, `${selected}.owned`);
                await Deno.symlink(outside, selected);
              }
              return await DEFAULT_IO.openRead(selected);
            },
          }),
        );
        const target = await fileTarget(rooted, 'asset.txt');

        await expectFailure(
          () => rooted.readFile(target, READ_OPTIONS),
          'unsafe-filesystem',
        );
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects final-entry replacement during and immediately after descriptor reads', async () => {
      for (const phase of ['read', 'after-read'] as const) {
        const fixture = await setup();
        try {
          await Deno.mkdir(fixture.outside, { recursive: true });
          const outside = Fs.join(fixture.outside, 'private.txt');
          await Deno.writeTextFile(outside, 'private');
          const path = Fs.join(fixture.root, 'asset.txt');
          await Deno.mkdir(fixture.root);
          await Deno.writeTextFile(path, 'declared');
          let replaced = false;
          let statCalls = 0;
          const replace = async () => {
            if (replaced) return;
            replaced = true;
            await Deno.rename(path, `${path}.owned`);
            await Deno.symlink(outside, path);
          };
          const rooted = await createRooted(
            { root: fixture.root },
            withIo({
              openRead: async (selected) => {
                const file = await DEFAULT_IO.openRead(selected);
                return wrapReadHandle(file, {
                  read: async (data) => {
                    const length = await file.read(data);
                    if (phase === 'read' && length !== null) await replace();
                    return length;
                  },
                  stat: async () => {
                    const info = await file.stat();
                    statCalls += 1;
                    if (phase === 'after-read' && statCalls === 2) await replace();
                    return info;
                  },
                });
              },
            }),
          );
          const target = await fileTarget(rooted, 'asset.txt');

          await expectFailure(
            () => rooted.readFile(target, READ_OPTIONS),
            'unsafe-filesystem',
          );
        } finally {
          await teardown(fixture);
        }
      }
    });

    it('rejects regular ancestor replacement even when the final inode is retained', async () => {
      const fixture = await setup();
      try {
        const parent = Fs.join(fixture.root, 'assets');
        const moved = Fs.join(fixture.root, 'moved-assets');
        const path = Fs.join(parent, 'entry.txt');
        await Deno.mkdir(parent, { recursive: true });
        await Deno.writeTextFile(path, 'declared');
        let replaced = false;
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            openRead: async (selected) => {
              const file = await DEFAULT_IO.openRead(selected);
              return wrapReadHandle(file, {
                read: async (data) => {
                  const length = await file.read(data);
                  if (!replaced && length !== null) {
                    replaced = true;
                    await Deno.rename(parent, moved);
                    await Deno.mkdir(parent);
                    await Deno.link(Fs.join(moved, 'entry.txt'), path);
                  }
                  return length;
                },
              });
            },
          }),
        );
        const target = await fileTarget(rooted, 'assets/entry.txt');

        await expectFailure(
          () => rooted.readFile(target, READ_OPTIONS),
          'unsafe-filesystem',
        );
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects rooted directory replacement during a descriptor read', async () => {
      const fixture = await setup();
      try {
        await Deno.mkdir(fixture.root);
        const path = Fs.join(fixture.root, 'asset.txt');
        await Deno.writeTextFile(path, 'declared');
        let replaced = false;
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            openRead: async (selected) => {
              const file = await DEFAULT_IO.openRead(selected);
              return wrapReadHandle(file, {
                read: async (data) => {
                  const length = await file.read(data);
                  if (!replaced && length !== null) {
                    replaced = true;
                    await Deno.rename(fixture.root, Fs.join(fixture.workspace, 'moved-root'));
                    await Deno.mkdir(fixture.root);
                    await Deno.writeTextFile(Fs.join(fixture.root, 'asset.txt'), 'foreign');
                  }
                  return length;
                },
              });
            },
          }),
        );
        const target = await fileTarget(rooted, 'asset.txt');

        await expectFailure(
          () => rooted.readFile(target, READ_OPTIONS),
          'unsafe-filesystem',
        );
      } finally {
        await teardown(fixture);
      }
    });

    it('rejects a descriptor that does not identify the observed entry', async () => {
      const fixture = await setup();
      try {
        await Deno.mkdir(fixture.root);
        await Deno.mkdir(fixture.outside);
        await Deno.writeTextFile(Fs.join(fixture.root, 'asset.txt'), 'declared');
        const outside = Fs.join(fixture.outside, 'private.txt');
        await Deno.writeTextFile(outside, 'private');
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({ openRead: () => DEFAULT_IO.openRead(outside) }),
        );
        const target = await fileTarget(rooted, 'asset.txt');

        await expectFailure(
          () => rooted.readFile(target, READ_OPTIONS),
          'unsafe-filesystem',
        );
      } finally {
        await teardown(fixture);
      }
    });
  });

  describe('failure settlement', () => {
    it('preserves primary classification and both causes when descriptor cleanup also fails', async () => {
      const fixture = await setup();
      try {
        await Deno.mkdir(fixture.root);
        await Deno.writeTextFile(Fs.join(fixture.root, 'asset.txt'), 'declared');

        for (
          const [primary, expected] of [
            [new Deno.errors.NotSupported('descriptor stat unsupported'), 'unsupported'],
            [new Error('descriptor stat failed'), 'io-failure'],
          ] as const
        ) {
          const cleanup = new Error('descriptor cleanup failed');
          const rooted = await createRooted(
            { root: fixture.root },
            withIo({
              openRead: async (selected) => {
                const file = await DEFAULT_IO.openRead(selected);
                return wrapReadHandle(file, {
                  stat: () => Promise.reject(primary),
                  close: async () => {
                    await file.close();
                    throw cleanup;
                  },
                });
              },
            }),
          );
          const rootedTarget = await fileTarget(rooted, 'asset.txt');
          const result = await expectFailure(
            () => rooted.readFile(rootedTarget, READ_OPTIONS),
            expected,
          );
          expect(result.cause).to.be.instanceOf(AggregateError);
          const failures = (result.cause as AggregateError).errors;
          expect(failures[0]).to.equal(primary);
          expect(failures[1]).to.equal(cleanup);
        }

        const cleanup = new Error('descriptor cleanup failed');
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            openRead: async (selected) => {
              const file = await DEFAULT_IO.openRead(selected);
              return wrapReadHandle(file, {
                read: () => Promise.resolve(null),
                close: async () => {
                  await file.close();
                  throw cleanup;
                },
              });
            },
          }),
        );
        const rootedTarget = await fileTarget(rooted, 'asset.txt');
        const result = await expectFailure(
          () => rooted.readFile(rootedTarget, READ_OPTIONS),
          'unsafe-filesystem',
        );
        expect(result.cause).to.be.instanceOf(AggregateError);
        const failures = (result.cause as AggregateError).errors;
        expect(Fs.Capability.Rooted.Is.failure(failures[0])).to.eql(true);
        expect(failures[1]).to.equal(cleanup);
      } finally {
        await teardown(fixture);
      }
    });
  });
});
