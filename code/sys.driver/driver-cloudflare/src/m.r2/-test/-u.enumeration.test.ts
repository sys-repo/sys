import { describe, Err, expect, expectError, Files, Is, it, Obj, type t } from '../../-test.ts';
import { R2 } from '../mod.ts';
import { fakeBucket, r2FilesPolicy as policy, textObject } from './u.fixture.ts';

const limits: t.R2.Files.EnumerationLimits = {
  maxRequests: 4,
  maxObjects: 4,
  maxKeyBytes: 1024,
  maxEntries: 12,
  maxPathBytes: 2048,
};
const context = undefined as never;

describe('R2.Files enumeration budgets', () => {
  it('counts before paging/filtering and closes the overflowing iterator', async () => {
    const fixture = fakeBucket();
    let yielded = 0;
    let closed = false;
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      async *list(options) {
        options?.beforeRequest?.();
        try {
          for (let i = 0; i < 100; i++) {
            yielded++;
            yield { key: `hidden/${i}.txt`, size: 1 };
          }
        } finally {
          closed = true;
        }
      },
    };
    const source = backing(bucket);
    const error = await refuses(() =>
      source.handlers['files:list']({ limit: 1, match: 'visible/**' }, context)
    );
    expect(error.name).to.equal('FilesR2Error.EnumerationLimit');
    expect(yielded).to.equal(5);
    expect(closed).to.equal(true);
  });

  it('enforces finite defaults when enumeration policy is omitted', async () => {
    const fixture = fakeBucket();
    let yielded = 0;
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      async *list(options) {
        options?.beforeRequest?.();
        for (let i = 0; i < 20_000; i++) {
          yielded++;
          yield { key: `file-${i}`, size: 1 };
        }
      },
    };
    const source = R2.Files.create({ bucket, policy });
    await refuses(() => source.handlers['files:list']({ limit: 1 }, context));
    expect(yielded).to.equal(10_001);
  });

  it('charges records hidden by Files policy before building an empty result', async () => {
    const fixture = fakeBucket({ 'hidden/a': textObject('a'), 'hidden/b': textObject('b') });
    const source = R2.Files.create({
      bucket: fixture.bucket,
      policy: { ...policy, deny: 'hidden/**' },
      enumeration: { ...limits, maxObjects: 1 },
    });
    await refuses(() => source.handlers['files:list']({}, context));
    await refuses(() => source.handlers['files:manifest']({}, context));
  });

  it('allows exact object capacity only after uncapped enumeration completes', async () => {
    const { bucket } = fakeBucket({ a: textObject('a'), b: textObject('b') });
    const source = backing(bucket, { maxObjects: 2 });
    const page = await source.handlers['files:list']({ limit: 1 }, context);
    expect(page.entries.map((entry) => entry.path)).to.eql(['a']);
    expect(page.cursor).not.to.equal(undefined);
    const next = await source.handlers['files:list']({ cursor: page.cursor, limit: 1 }, context);
    expect(next.entries.map((entry) => entry.path)).to.eql(['b']);
    expect(next.cursor).to.equal(undefined);
    await refuses(() => backing(bucket, { maxObjects: 1 }).handlers['files:manifest']({}, context));
  });

  it('does not reset the request budget across empty continuation pages', async () => {
    const fixture = fakeBucket();
    let dispatched = 0;
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      // Empty pages still dispatch, even though this iterable never yields a record.
      // deno-lint-ignore require-yield
      async *list(options) {
        for (let i = 0; i < 10; i++) {
          options?.beforeRequest?.();
          dispatched++;
        }
      },
    };
    await refuses(() => backing(bucket, { maxRequests: 2 }).handlers['files:list']({}, context));
    expect(dispatched).to.equal(2);
  });

  it('does not report success when an injected bucket ignores request accounting', async () => {
    const fixture = fakeBucket();
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      async *list() {
        yield { key: 'a', size: 1 };
      },
    };
    await refuses(() => backing(bucket).handlers['files:list']({}, context), /request accounting/i);
  });

  it('charges duplicate and out-of-prefix records before discarding or indexing', async () => {
    const fixture = fakeBucket();
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      async *list(options) {
        options?.beforeRequest?.();
        for (let i = 0; i < 5; i++) yield { key: 'outside/a', size: 1 };
      },
    };
    const source = R2.Files.create({ bucket, policy, prefix: 'inside', enumeration: limits });
    await refuses(() => source.handlers['files:list']({}, context));
  });

  it('bounds UTF-8 key bytes, directory entries, and duplicated path storage', async () => {
    const unicode = fakeBucket({ 'éé': textObject('x') });
    await refuses(() =>
      backing(unicode.bucket, { maxKeyBytes: 3 }).handlers['files:list']({}, context)
    );
    const deep = fakeBucket({ 'a/b/c/d': textObject('x') });
    await refuses(() =>
      backing(deep.bucket, { maxEntries: 3 }).handlers['files:list']({}, context)
    );
    const file = fakeBucket({ abc: textObject('x') });
    await refuses(() =>
      backing(file.bucket, { maxPathBytes: 5 }).handlers['files:list']({}, context)
    );
  });

  it('captures a complete finite policy before any calls', () => {
    const { bucket, calls } = fakeBucket();
    for (const key of Obj.keys(limits)) {
      for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
        expect(() => backing(bucket, { [key]: value })).to.throw(/enumeration/i);
      }
    }
    expect(() => R2.Files.create({ bucket, enumeration: {} as t.R2.Files.EnumerationLimits }))
      .to.throw(/enumeration/i);
    expect(calls).to.eql([]);
  });

  it('rejects policy accessors without invoking them', () => {
    const { bucket } = fakeBucket();
    let reads = 0;
    const enumeration = {
      ...limits,
      get maxObjects() {
        reads++;
        return 1;
      },
    };
    expect(() => R2.Files.create({ bucket, policy, enumeration })).to.throw(/enumeration/i);
    expect(reads).to.equal(0);
  });

  it('snapshots limits and renews counters for each independent command', async () => {
    const { bucket } = fakeBucket({ a: textObject('a'), b: textObject('b') });
    const enumeration = { ...limits, maxObjects: 1 };
    const source = R2.Files.create({ bucket, policy, enumeration });
    enumeration.maxObjects = 100;
    await refuses(() => source.handlers['files:list']({}, context));
    await refuses(() => source.handlers['files:list']({}, context));
    const small = backing(fakeBucket({ a: textObject('a') }).bucket, { maxRequests: 1 });
    const results = await Promise.all([
      small.handlers['files:list']({}, context),
      small.handlers['files:manifest']({}, context),
    ]);
    expect(results.every((result) => result.entries.length === 1)).to.equal(true);
  });

  it('refuses recursive removal overflow before the first delete', async () => {
    const { bucket, calls, store } = fakeBucket({
      'dir/a': textObject('a'),
      'dir/b': textObject('b'),
    });
    const source = backing(bucket, { maxObjects: 1 });
    await refuses(() => source.handlers['files:remove']({ path: 'dir', recursive: true }, context));
    expect(calls.some((call) => Is.array(call) && call[0] === 'remove')).to.equal(false);
    expect(store.size).to.equal(2);
  });

  it('admits the whole removal tree and all policies before deletion', async () => {
    const collision = fakeBucket({ 'dir/a': textObject('x'), 'dir/a/b': textObject('y') });
    await refuses(
      () =>
        backing(collision.bucket).handlers['files:remove'](
          { path: 'dir', recursive: true },
          context,
        ),
      /collision/i,
    );
    expect(collision.store.size).to.equal(2);
    const fixture = fakeBucket({ 'dir/a': textObject('a'), 'dir/b': textObject('b') });
    const source = R2.Files.create({
      bucket: fixture.bucket,
      enumeration: limits,
      policy: { ...policy, remove: ['dir', 'dir/a'] },
    });
    await refuses(
      () => source.handlers['files:remove']({ path: 'dir', recursive: true }, context),
      /denied/i,
    );
    expect(fixture.store.size).to.equal(2);
  });

  it('uses a bounded nonempty probe for nonrecursive directory refusal', async () => {
    const fixture = fakeBucket();
    let yielded = 0;
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      async *list(options) {
        options?.beforeRequest?.();
        for (let i = 0; i < 100; i++) {
          yielded++;
          yield { key: `dir/${i}`, size: 1 };
        }
      },
    };
    await refuses(
      () => backing(bucket).handlers['files:remove']({ path: 'dir' }, context),
      /not empty/i,
    );
    expect(yielded).to.equal(1);
  });

  it('keeps successful removal and post-delete provider failure truthful', async () => {
    const success = fakeBucket({ 'dir/a': textObject('a') });
    await backing(success.bucket).handlers['files:remove'](
      { path: 'dir', recursive: true },
      context,
    );
    expect(success.store.size).to.equal(0);
    const fixture = fakeBucket({ 'dir/a': textObject('a'), 'dir/b': textObject('b') });
    let deletes = 0;
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      remove(key) {
        if (++deletes === 2) throw new Error('provider failed');
        return fixture.bucket.remove(key);
      },
    };
    const error = await refuses(
      () => backing(bucket).handlers['files:remove']({ path: 'dir', recursive: true }, context),
      /partially failed/i,
    );
    expect(error.name).to.equal('FilesR2Error.PartialFailure');
    expect(fixture.store.size).to.equal(1);
  });

  it('bounds stat, read, and write existence probes without issuing later mutations', async () => {
    const fixture = fakeBucket({ a: textObject('a') });
    let dispatched = 0;
    let closed = 0;
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      // deno-lint-ignore require-yield
      async *list(options) {
        try {
          for (let i = 0; i < 5; i++) {
            options?.beforeRequest?.();
            dispatched++;
          }
        } finally {
          closed++;
        }
      },
    };
    const source = backing(bucket, { maxRequests: 1 });
    await refuses(() => source.handlers['files:stat']({ path: 'a' }, context));
    await refuses(() => source.handlers['files:read']({ path: 'a' }, context));
    await refuses(() =>
      source.handlers['files:write']({ path: 'a', kind: 'text', content: 'b' }, context)
    );
    expect(dispatched).to.equal(3);
    expect(closed).to.equal(3);
    expect(
      fixture.calls.some((call) => Is.array(call) && (call[0] === 'read' || call[0] === 'write')),
    )
      .to.equal(false);
    expect(fixture.store.get('a')?.body).to.equal('a');
  });

  it('does not let depth, exclusion, or a larger result limit enlarge scan authority', async () => {
    const fixture = fakeBucket({ 'hidden/a': textObject('a'), 'hidden/b': textObject('b') });
    const source = backing(fixture.bucket, { maxObjects: 1 });
    for (const query of [{ depth: 0 }, { exclude: '**' }, { limit: 1000 }]) {
      await refuses(() => source.handlers['files:list'](query, context));
      await refuses(() => source.handlers['files:manifest'](query, context));
    }
  });

  it('refuses removal index, target-path, and key admission before deletion', async () => {
    for (const override of [{ maxEntries: 2 }, { maxPathBytes: 25 }, { maxKeyBytes: 4 }]) {
      const fixture = fakeBucket({ 'dir/a': textObject('a') });
      await refuses(() =>
        backing(fixture.bucket, override).handlers['files:remove'](
          { path: 'dir', recursive: true },
          context,
        )
      );
      expect(fixture.store.size).to.equal(1);
      expect(fixture.calls.some((call) => Is.array(call) && call[0] === 'remove')).to.equal(false);
    }
    const fixture = fakeBucket({ [`dir/${'x'.repeat(1024)}`]: textObject('a') });
    await refuses(
      () =>
        backing(fixture.bucket, { maxKeyBytes: 2048 }).handlers['files:remove']({
          path: 'dir',
          recursive: true,
        }, context),
      /key exceeds byte limit/i,
    );
    expect(fixture.store.size).to.equal(1);
  });

  it('charges duplicate removal target paths even when the index deduplicates', async () => {
    const fixture = fakeBucket({ 'dir/a': textObject('a') });
    const bucket: t.R2.Bucket = {
      ...fixture.bucket,
      async *list(options) {
        options?.beforeRequest?.();
        yield { key: 'dir/a', size: 1 };
        yield { key: 'dir/a', size: 1 };
      },
    };
    await refuses(() =>
      backing(bucket, { maxPathBytes: 30 }).handlers['files:remove']({
        path: 'dir',
        recursive: true,
      }, context)
    );
    expect(fixture.store.size).to.equal(1);
  });

  it('accounts for manifest reference paths separately from index paths', async () => {
    const fixture = fakeBucket({ abc: textObject('a') }, 'https://example.com');
    const source = backing(fixture.bucket, { maxPathBytes: 6 });
    expect((await source.handlers['files:manifest']({}, context)).entries.length).to.equal(1);
    await refuses(() => source.handlers['files:manifest']({ contentRefs: true }, context));
  });

  it('surfaces a redacted enumeration refusal through Files Cmd', async () => {
    const fixture = fakeBucket({ 'private/a': textObject('a'), 'private/b': textObject('b') });
    const files = Files.Client.local(backing(fixture.bucket, { maxObjects: 1 }));
    try {
      const error = await refuses(() => files.list({ limit: 1 }));
      expect(Err.summary(error, { cause: true })).not.to.include('private/');
    } finally {
      files.dispose();
    }
  });
});

/**
 * Helpers:
 */
function backing(bucket: t.R2.Bucket, override: Partial<t.R2.Files.EnumerationLimits> = {}) {
  return R2.Files.create({ bucket, policy, enumeration: { ...limits, ...override } });
}

async function refuses(run: () => unknown, pattern = /enumeration limit/i) {
  const failure = await expectError(async () => {
    await run();
  });
  expect(Err.summary(failure, { cause: true })).to.match(pattern);
  return Err.std(failure);
}
