import {
  chunks,
  createRooted,
  DEFAULT_IO,
  describe,
  expect,
  expectTypeOf,
  expectWriteFailure,
  Fs,
  it,
  Num,
  OPTIONS,
  setup,
  type t,
  teardown,
  treeFile,
  withIo,
} from './u.fixture.writer.ts';
import { Dispose, Is, Rx } from '../common.ts';
import { treeWriteInput } from '../u/u.write.input.ts';

const directory = (path: string): t.FsRooted.TreeDirectory => ({ kind: 'directory', path });

describe('Fs.Capability.Rooted writer admission', () => {
  it('rejects executable containers, malformed paths and topology before producer lookup or I/O', async () => {
    const fixture = await setup();
    try {
      let observations = 0;
      let executions = 0;
      const io = withIo({
        lstat: async (path) => {
          observations++;
          return await DEFAULT_IO.lstat(path);
        },
        open: async (path, options) => {
          observations++;
          return await DEFAULT_IO.open(path, options);
        },
        mkdir: async (path, options) => {
          observations++;
          await DEFAULT_IO.mkdir(path, options);
        },
        readDir(path) {
          observations++;
          return DEFAULT_IO.readDir(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const stage = await rooted.Stage.create();
      const content = Object.defineProperty({}, Symbol.asyncIterator, {
        get() {
          executions++;
          throw new Error('lookup');
        },
      });
      const file = treeFile(content);
      const getter = Object.defineProperty({}, 'kind', {
        get() {
          executions++;
          return 'file';
        },
      });
      const sparse = new Array(1);
      const extra = Object.assign([file], { extra: true });
      const tagged = Object.assign([file], {
        [Symbol.iterator]: () => {
          executions++;
          return [][Symbol.iterator]();
        },
      });
      const accessor: unknown[] = [];
      Object.defineProperty(accessor, '0', {
        enumerable: true,
        get() {
          executions++;
          return file;
        },
      });
      const revoked = Proxy.revocable([file], {});
      revoked.revoke();
      const proxied = new Proxy([file], {
        getPrototypeOf() {
          executions++;
          throw new Error('trap');
        },
      });
      const inherited = Object.create(file);
      const cases: readonly (readonly [unknown, t.FsRooted.FailureKind])[] = [
        [sparse, 'invalid-target'],
        [extra, 'invalid-target'],
        [tagged, 'invalid-target'],
        [accessor, 'invalid-target'],
        [revoked.proxy, 'invalid-target'],
        [proxied, 'invalid-target'],
        [[getter], 'invalid-target'],
        [[inherited], 'invalid-target'],
        [[new Proxy(file, {})], 'invalid-target'],
        [[{ ...file, extra: true }], 'invalid-target'],
        [[{ ...file, [Symbol.toStringTag]: 'File' }], 'invalid-target'],
        [[{ ...file, path: '\ud800' }], 'invalid-target'],
        [[{ ...file, path: '../escape' }], 'invalid-target'],
        [[{ ...file, path: '.sys.rooted/file' }], 'invalid-target'],
        [[{ ...file, path: 'missing/file' }], 'invalid-target'],
        [[directory('a'), directory('./a')], 'target-collision'],
        [[treeFile(content, 0, 'a'), directory('a/b')], 'target-collision'],
        [[{ ...directory('a'), content }], 'invalid-target'],
      ];
      observations = 0;
      for (const [input, kind] of cases) await expectWriteFailure(stage, input, OPTIONS, kind);
      for (
        const input of [
          undefined,
          { ...OPTIONS, extra: true },
          new Proxy(OPTIONS, {}),
          Object.create(OPTIONS),
          { ...OPTIONS, [Symbol.toStringTag]: 'Options' },
          Object.defineProperty({ ...OPTIONS }, 'timeout', {
            get() {
              executions++;
              return 1;
            },
          }),
          { ...OPTIONS, until: [new Array(1)] },
          { ...OPTIONS, until: [new Proxy([], {})] },
        ]
      ) {
        await expectWriteFailure(stage, [file], input, 'invalid-options');
      }
      expect(observations).to.eql(0);
      expect(executions).to.eql(0);
      await stage.files.Target.admit([]); // Rejected admission never claimed the stage.
      await stage.writer.writeTree([], OPTIONS);
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('enforces exact numeric, raw UTF-8, depth, entry and aggregate boundaries', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const stage = await rooted.Stage.create();
      for (
        const key of ['maxEntries', 'maxPathBytes', 'maxPathDepth', 'maxFileBytes', 'maxTreeBytes']
      ) {
        for (const value of [0, -1, 0.5, Num.INFINITY, Num.MAX_INT + 1, NaN, '1']) {
          await expectWriteFailure(stage, [], { ...OPTIONS, [key]: value }, 'invalid-options');
        }
      }
      for (const value of [-1, 0.5, Num.INFINITY, Num.MAX_INT + 1, NaN, '1']) {
        await expectWriteFailure(stage, [], { ...OPTIONS, timeout: value }, 'invalid-options');
        await expectWriteFailure(
          stage,
          [treeFile(chunks(), value as number)],
          OPTIONS,
          'invalid-target',
        );
      }
      const boundCases: readonly (readonly [
        readonly t.FsRooted.TreeEntry[],
        Partial<t.FsRooted.TreeWriteOptions>,
      ])[] = [
        [[directory('a'), directory('b')], { maxEntries: 1 }],
        [[directory('ab')], { maxPathBytes: 1 }],
        [[directory('é')], { maxPathBytes: 1 }],
        [[directory('./a')], { maxPathBytes: 1 }],
        [[directory('a'), directory('a/b')], { maxPathDepth: 1 }],
        [[treeFile(chunks(), 2)], { maxFileBytes: 1 }],
        [[treeFile(chunks(), Num.MAX_INT, 'a'), treeFile(chunks(), 1, 'b')], {
          maxFileBytes: Num.MAX_INT,
          maxTreeBytes: Num.MAX_INT,
        }],
      ];
      for (const [entries, options] of boundCases) {
        await expectWriteFailure(stage, entries, { ...OPTIONS, ...options }, 'limit-exceeded');
      }
      const exact = treeWriteInput([directory('é'), treeFile(chunks(), 2, 'é/a')], {
        ...OPTIONS,
        maxPathBytes: 4,
        maxPathDepth: 2,
        maxEntries: 2,
        maxFileBytes: 2,
        maxTreeBytes: 2,
      });
      expect(exact.entries.map((entry) => entry.path)).to.eql(['é', 'é/a']);
      for (const path of ['a', './a', 'a//b', 'a/./b', 'é/空', './é/空/']) {
        const supplied = path.includes('b')
          ? [directory('a'), directory(path)]
          : path.includes('空')
          ? [directory('é'), directory(path)]
          : [directory(path)];
        const snapshot = treeWriteInput(supplied, OPTIONS);
        const normalized = snapshot.entries.at(-1)!.path;
        expect(
          new TextEncoder().encode(normalized).byteLength <=
            new TextEncoder().encode(path).byteLength,
        ).to.eql(true);
      }
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('snapshots specification and lifecycle arrays while admitted signal leaves remain live', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const stage = await rooted.Stage.create();
      const original = new AbortController();
      const replacement = new AbortController();
      const until = [[original.signal]];
      const entries = [treeFile(chunks(new Uint8Array([7])), 1, 'original')];
      const options = { ...OPTIONS, until };
      const writing = stage.writer.writeTree(entries, options);
      Object.assign(entries[0], treeFile(null, 100, 'changed'));
      entries[0] = treeFile(null, 100, 'replaced');
      options.maxTreeBytes = 0;
      until[0][0] = replacement.signal;
      replacement.abort();
      await writing;
      expect(await Deno.readFile(Fs.join(stage.path, 'original'))).to.eql(new Uint8Array([7]));
      expect(await Fs.exists(Fs.join(stage.path, 'changed'))).to.eql(false);
      await rooted.Stage.discard(stage);
      const second = await rooted.Stage.create();
      const pending = second.writer.writeTree([], { ...OPTIONS, until: [[original.signal]] });
      original.abort();
      const failure = await pending.catch((error: t.FsRooted.Failure) => error);
      expect(failure?.kind).to.eql('cancelled');
      await second.writer.writeTree([], OPTIONS);
      await rooted.Stage.discard(second);
    } finally {
      await teardown(fixture);
    }
  });

  it('captures every lifecycle container before a leaf getter can replace sibling cancellation authority', async () => {
    const fixture = await setup();
    try {
      let reads = 0;
      let producers = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async lstat(path) {
            reads++;
            return await DEFAULT_IO.lstat(path);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      const original = new AbortController();
      original.abort();
      const replacement = new AbortController();
      const nested = [original.signal];
      const view: t.LifecycleView = {
        get disposed() {
          nested[0] = replacement.signal;
          return false;
        },
        dispose$: Rx.subject<t.DisposeEvent>(),
      };
      const until = [view, nested];
      const content = Object.defineProperty({}, Symbol.asyncIterator, {
        get() {
          producers++;
          return () => chunks();
        },
      });
      const entries = [treeFile(content, 0)];
      const options = { ...OPTIONS, until };
      reads = 0;
      await expectWriteFailure(stage, entries, options, 'cancelled');
      expect(reads).to.eql(0); // Every construction I/O path starts with stage validation.
      expect(producers).to.eql(0);
      expect(nested[0]).to.equal(replacement.signal);
      nested[0] = original.signal;
      const captured = treeWriteInput(entries, options).options.until;
      if (!Is.array(captured) || !Is.array(captured[1])) throw new Error('Expected nested arrays');
      expect(captured[0]).to.equal(view);
      expect(captured[1][0]).to.equal(original.signal);
      expect(Object.isFrozen(captured)).to.eql(true);
      expect(Object.isFrozen(captured[1])).to.eql(true);
      await stage.writer.writeTree([], OPTIONS);
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('observes canonical lifecycle inputs without acquiring upstream disposal authority', async () => {
    expectTypeOf(OPTIONS.until).toEqualTypeOf<t.UntilInput>();
    const fixture = await setup();
    const source: t.Lifecycle = Rx.lifecycle();
    const cleanup = Promise.withResolvers<void>();
    const asyncSource: t.LifecycleAsync = Rx.lifecycleAsync(() => cleanup.promise);
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const stage = await rooted.Stage.create();
      // Canonical omitDispose projections are Proxies; Rooted does not exempt them from admission.
      for (
        const until of [asyncSource, Dispose.omitDispose(asyncSource), Dispose.omitDispose(source)]
      ) {
        await expectWriteFailure(stage, [], { ...OPTIONS, until }, 'invalid-options');
      }
      expect(asyncSource.disposed).to.eql(false);
      // Explicit async telemetry is an event stream: its first emission, not cleanup completion,
      // is the stop request. A direct LifecycleAsync is deliberately not an UntilInput.
      const cancelled = expectWriteFailure(
        stage,
        [],
        { ...OPTIONS, until: asyncSource.dispose$ },
        'cancelled',
      );
      const disposal = asyncSource.dispose();
      await cancelled;
      expect(asyncSource.disposed).to.eql(false);
      cleanup.resolve();
      await disposal;
      await stage.writer.writeTree([], { ...OPTIONS, until: source });
      expect(source.disposed).to.eql(false); // Writer cleanup disposes only its own Abortable.
      await rooted.Stage.discard(stage);
    } finally {
      source.dispose();
      cleanup.resolve();
      await asyncSource.dispose();
      await teardown(fixture);
    }
  });

  it('zero timeout and already terminal lifecycles perform no I/O and leave the writer unclaimed', async () => {
    const fixture = await setup();
    try {
      let reads = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          lstat: async (path) => {
            reads++;
            return await DEFAULT_IO.lstat(path);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      const aborted = new AbortController();
      aborted.abort();
      const disposed = Rx.lifecycle();
      disposed.dispose();
      reads = 0;
      await expectWriteFailure(stage, [], { ...OPTIONS, timeout: 0 }, 'timeout');
      const view: t.LifecycleView = {
        get disposed() {
          return disposed.disposed;
        },
        dispose$: disposed.dispose$,
      };
      for (const until of [aborted.signal, disposed, view, Rx.of({ reason: 'sync' })]) {
        await expectWriteFailure(stage, [], { ...OPTIONS, until }, 'cancelled');
      }
      expect(reads).to.eql(0);
      await stage.writer.writeTree([], { ...OPTIONS, timeout: Num.MAX_INT });
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });
});
