import {
  describe,
  Err,
  expect,
  expectError,
  expectTypeOf,
  Fs,
  Is,
  it,
  Path,
  Testing,
} from '../../-test.ts';
import { createWithTmpDir } from './u.withTmpDir.ts';

type Io = Parameters<typeof createWithTmpDir>[0];

describe('Testing.withTmpDir', () => {
  it('canonical usable root → callback value → cleanup', async () => {
    let root = '';
    const value = { answer: 42 };
    const result = Testing.withTmpDir(async (dir) => {
      root = dir;
      expect(Path.Is.absolute(dir)).to.eql(true);
      expect(await Fs.realPath(dir)).to.eql(dir);
      const path = Fs.join(dir, 'nested/value.txt');
      await Fs.write(path, 'fixture', { throw: true });
      expect((await Fs.readText(path)).data).to.eql('fixture');
      return value;
    });
    expectTypeOf(result).toEqualTypeOf<Promise<typeof value>>();
    expect(await result).to.equal(value);
    expect(await Fs.exists(root)).to.eql(false);
  });

  it('preserves sync/async result inference and undefined values', async () => {
    const { run } = fixture();
    const sync = run((): number => 42);
    const async = run((): Promise<number> => Promise.resolve(42));
    const empty = run(() => undefined);
    expectTypeOf(sync).toEqualTypeOf<Promise<number>>();
    expectTypeOf(async).toEqualTypeOf<Promise<number>>();
    expectTypeOf(empty).toEqualTypeOf<Promise<undefined>>();
    expect(await Promise.all([sync, async, empty])).to.eql([42, 42, undefined]);
  });

  it('preserves default, undefined and custom prefixes', async () => {
    const options = [undefined, {}, { prefix: undefined }, { prefix: 'scoped.fixture.' }];
    for (const option of options) {
      const root = await Testing.withTmpDir((dir) => {
        expect(Path.basename(dir).startsWith(option?.prefix ?? 'sys.testing.')).to.eql(true);
        return dir;
      }, option);
      expect(await Fs.exists(root)).to.eql(false);
    }
  });

  it('already-removed root → successful cleanup', async () => {
    const result = await Testing.withTmpDir(async (dir) => {
      await Fs.remove(dir);
      return 'removed';
    });
    expect(result).to.eql('removed');
  });

  it('isolates nested and concurrent lifetimes', async () => {
    const roots: string[] = [];
    await Promise.all([0, 1].map(() =>
      Testing.withTmpDir(async (outer) => {
        roots.push(outer);
        const inner = await Testing.withTmpDir((dir) => {
          roots.push(dir);
          expect(dir).to.not.eql(outer);
          return dir;
        });
        expect(await Fs.exists(inner)).to.eql(false);
        expect(await Fs.exists(outer)).to.eql(true);
      })
    ));
    expect(new Set(roots).size).to.eql(4);
    for (const root of roots) expect(await Fs.exists(root)).to.eql(false);
  });

  it('real callback rejection → unchanged failure and deleted root', async () => {
    let root = '';
    const cause = new Error('callback failed');
    const error = await expectError(() =>
      Testing.withTmpDir(async (dir) => {
        root = dir;
        await Fs.write(Fs.join(dir, 'value.txt'), 'fixture', { throw: true });
        throw cause;
      })
    );
    expect(error).to.equal(cause);
    expect(await Fs.exists(root)).to.eql(false);
  });

  it('real synchronous throw → unchanged failure and deleted root', async () => {
    let root = '';
    const cause = new Error('synchronous callback failed');
    const error = await expectError(() =>
      Testing.withTmpDir((dir) => {
        root = dir;
        throw cause;
      })
    );
    expect(error).to.equal(cause);
    expect(await Fs.exists(root)).to.eql(false);
  });

  it('preserves raw sync throws and async rejections, including falsy values', async () => {
    const failures = [new Error('original'), undefined, null, false, 0, 'failure'];
    for (const cause of failures) {
      for (const async of [false, true]) {
        const { run, calls, removed, allocated } = fixture();
        const callback = async ? () => Promise.reject(cause) : () => {
          throw cause;
        };
        const error = await expectError(() => run(callback));
        expect(error).to.equal(cause);
        expect(calls).to.eql(['allocate', 'canonicalize', 'cleanup']);
        expect(removed).to.eql([allocated]);
      }
    }
  });

  it('allocation failure → no callback or cleanup', async () => {
    for (const cause of [new Error('allocation failed'), undefined, null, false, 0, 'allocation']) {
      const { run, calls } = fixture({
        makeTempDir: () => {
          throw cause;
        },
      });
      const error = await expectError(() => run(() => expect.fail('callback must not run')));
      expect(error).to.equal(cause);
      expect(calls).to.eql(['allocate']);
    }
  });

  it('canonicalization failure → original-path cleanup without callback', async () => {
    for (
      const cause of [new Error('canonicalization failed'), undefined, null, false, 0, 'setup']
    ) {
      const { run, calls, removed, allocated } = fixture({
        realPath: () => {
          throw cause;
        },
      });
      const error = await expectError(() => run(() => expect.fail('callback must not run')));
      expect(error).to.equal(cause);
      expect(calls).to.eql(['allocate', 'canonicalize', 'cleanup']);
      expect(removed).to.eql([allocated]);
    }
  });

  it('canonical callback path differs from owned cleanup path', async () => {
    const { run, removed, allocated, canonical } = fixture();
    expect(allocated).to.not.eql(canonical);
    expect(await run((dir) => dir)).to.eql(canonical);
    expect(removed).to.eql([allocated]);
  });

  it('cleanup failure after success → exact rejection', async () => {
    for (const cause of [new Error('cleanup failed'), undefined, null, false, 0, 'cleanup']) {
      const { run, calls } = fixture({
        remove: () => {
          throw cause;
        },
      });
      const error = await expectError(() => run(() => 'value'));
      expect(error).to.equal(cause);
      expect(calls).to.eql(['allocate', 'canonicalize', 'cleanup']);
    }
  });

  it('execution and cleanup failure → ordered aggregate diagnostics', async () => {
    const cleanup = new Error('cleanup failed');
    for (const phase of ['canonicalization', 'callback'] as const) {
      const original = new Error(`${phase} failed`);
      const { run, calls } = fixture({
        realPath: phase === 'canonicalization'
          ? () => {
            throw original;
          }
          : undefined,
        remove: () => {
          throw cleanup;
        },
      });
      const error = await expectError(() =>
        run(() => {
          throw original;
        })
      );
      expect(Is.stdError(error)).to.eql(true);
      if (!Is.stdError(error)) throw new Error('Expected a standard aggregate');
      expect(error.name).to.eql('AggregateError');
      expect(error.errors?.map(({ message }) => message)).to.eql([
        original.message,
        cleanup.message,
      ]);
      expect(calls).to.eql(['allocate', 'canonicalize', 'cleanup']);
    }
  });

  it('falsy execution failure plus cleanup failure remains an aggregate', async () => {
    const cleanup = new Error('cleanup failed');
    for (const cause of [undefined, null, false, 0, 'failure']) {
      const { run } = fixture({
        remove: () => {
          throw cleanup;
        },
      });
      const error = await expectError(() =>
        run(() => {
          throw cause;
        })
      );
      expect(Is.stdError(error)).to.eql(true);
      if (!Is.stdError(error)) throw new Error('Expected a standard aggregate');
      expect(error.name).to.eql('AggregateError');
      expect(error.errors).to.eql([Err.std(cause), Err.std(cleanup)]);
    }
  });

  for (const fails of [false, true]) {
    it(`awaits deferred cleanup before ${fails ? 'rejecting' : 'resolving'}`, async () => {
      const entered = Promise.withResolvers<void>();
      const release = Promise.withResolvers<boolean>();
      const cause = new Error('callback failed');
      let cleanupComplete = false;
      const { run } = fixture({
        async remove() {
          entered.resolve();
          const removed = await release.promise;
          cleanupComplete = true;
          return removed;
        },
      });
      let settled = false;
      const result = run(() => {
        if (fails) throw cause;
        return 'value';
      }).then(
        (value) => {
          settled = true;
          expect(cleanupComplete).to.eql(true);
          return { value };
        },
        (error: unknown) => {
          settled = true;
          expect(cleanupComplete).to.eql(true);
          return { error };
        },
      );
      try {
        await entered.promise;
        expect(settled).to.eql(false);
      } finally {
        release.resolve(true);
      }
      expect(await result).to.eql(fails ? { error: cause } : { value: 'value' });
      expect(settled).to.eql(true);
    });
  }
});

/** Deterministic three-operation fixture; no filesystem effects or global patching. */
function fixture(overrides: Partial<Io> = {}) {
  const allocated = Fs.toDir(Path.resolve('.tmp/withTmpDir.allocated'));
  const canonical = Path.resolve('.tmp/withTmpDir.canonical');
  const calls: string[] = [];
  const removed: string[] = [];
  const run = createWithTmpDir({
    async makeTempDir(options) {
      calls.push('allocate');
      return await (overrides.makeTempDir?.(options) ?? allocated);
    },
    async realPath(path) {
      calls.push('canonicalize');
      return await (overrides.realPath?.(path) ?? canonical);
    },
    async remove(path, options) {
      calls.push('cleanup');
      removed.push(path);
      return await (overrides.remove?.(path, options) ?? true);
    },
  });
  return { run, allocated: allocated.absolute, canonical, calls, removed };
}
