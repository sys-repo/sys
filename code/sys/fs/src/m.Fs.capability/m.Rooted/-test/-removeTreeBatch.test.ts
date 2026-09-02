import {
  createRooted,
  DEFAULT_IO,
  describe,
  expect,
  expectFailure,
  expectTypeOf,
  Fs,
  it,
  setup,
  type t,
  teardown,
  withIo,
  wrapFile,
} from './u.fixture.ts';
import { Rx } from '../common.ts';
import { toLockName } from '../u/u.lock.ts';
import {
  type BatchOwner,
  removeTreeBatch as removeBatch,
  removeTreeBatchInput,
} from '../u/u.remove.batch.ts';
import { acquiredLease, directoryTarget } from './u.fixture.target.ts';
import { writeDistTree as writeTree } from './u.fixture.tree.ts';

function requireFailed(
  result: t.FsRooted.RemoveTreeBatchResult,
): t.FsRooted.RemoveTreeBatchFailed {
  expect(result.kind).to.eql('failed');
  if (result.kind !== 'failed') throw new Error('Expected failed batch removal.');
  return result;
}

function requireSettled(
  result: t.FsRooted.RemoveTreeBatchResult,
): t.FsRooted.RemoveTreeBatchSettled {
  expect(result.kind).to.eql('settled');
  if (result.kind !== 'settled') throw new Error('Expected settled batch removal.');
  return result;
}

function batchOwner(rooted: t.FsRooted.Instance): BatchOwner {
  return {
    admit: rooted.admit,
    acquireLease: rooted.acquireLease,
    removeTree: rooted.removeTree,
  };
}

describe('Fs.Capability.Rooted.removeTreeBatch input and settlements', () => {
  it('snapshots path and lifecycle arrays before I/O and rejects hostile containers', async () => {
    const fixture = await setup();
    try {
      let calls = 0;
      const io = withIo({
        lstat: async (path) => {
          calls += 1;
          return await DEFAULT_IO.lstat(path);
        },
        realPath: async (path) => {
          calls += 1;
          return await DEFAULT_IO.realPath(path);
        },
        readDir(path) {
          calls += 1;
          return DEFAULT_IO.readDir(path);
        },
        mkdir: async (path, options) => {
          calls += 1;
          await DEFAULT_IO.mkdir(path, options);
        },
        open: async (path, options) => {
          calls += 1;
          return await DEFAULT_IO.open(path, options);
        },
        openMode: async (path) => {
          calls += 1;
          return await DEFAULT_IO.openMode(path);
        },
        link: async (oldpath, newpath) => {
          calls += 1;
          await DEFAULT_IO.link(oldpath, newpath);
        },
        rename: async (oldpath, newpath) => {
          calls += 1;
          await DEFAULT_IO.rename(oldpath, newpath);
        },
        remove: async (path, options) => {
          calls += 1;
          await DEFAULT_IO.remove(path, options);
        },
        wait: async (msecs, signal) => {
          calls += 1;
          await DEFAULT_IO.wait(msecs, signal);
        },
        token: () => {
          calls += 1;
          return DEFAULT_IO.token();
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      calls = 0;

      let lifecycleSubscriptions = 0;
      const lifecycle = new Rx.Observable<t.DisposeEvent>(() => {
        lifecycleSubscriptions += 1;
      });
      const empty = requireSettled(await rooted.removeTreeBatch([], { until: lifecycle }));
      expect(empty).to.eql({ kind: 'settled', results: [] });
      expect(Object.isFrozen(empty)).to.eql(true);
      expect(Object.isFrozen(empty.results)).to.eql(true);
      expect(lifecycleSubscriptions).to.eql(0);
      expect(calls).to.eql(0);
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted'))).to.eql(false);

      let getterCalls = 0;
      let trapCalls = 0;
      const sparse = new Array<string>(1);
      const accessor: string[] = [];
      Object.defineProperty(accessor, '0', {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'accessor';
        },
      });
      const proxied = new Proxy(['proxy'], {
        get() {
          throw new Error('TARGET-SECRET');
        },
      });
      const revoked = Proxy.revocable(['revoked'], {});
      revoked.revoke();
      const remove = rooted.removeTreeBatch as unknown as (
        targets: unknown,
        options?: unknown,
      ) => Promise<t.FsRooted.RemoveTreeBatchResult>;

      for (const input of [sparse, accessor, proxied, revoked.proxy, { 0: 'object', length: 1 }]) {
        const failure = await expectFailure(() => remove(input), 'invalid-target');
        expect(failure.operation).to.eql('remove-tree-batch');
      }
      const hostileOptions = Object.defineProperty({}, 'until', {
        enumerable: true,
        get() {
          getterCalls += 1;
          return undefined;
        },
      });
      const taggedOptions = Object.defineProperty({}, Symbol.toStringTag, {
        get() {
          getterCalls += 1;
          return 'Object';
        },
      });
      const proxiedOptions = new Proxy({ until: undefined }, {
        get() {
          trapCalls += 1;
          throw new Error('OPTIONS-SECRET');
        },
      });
      const proxyPrototype = new Proxy(Array.prototype, {
        get() {
          trapCalls += 1;
          throw new Error('PROTOTYPE-SECRET');
        },
        getPrototypeOf() {
          trapCalls += 1;
          throw new Error('PROTOTYPE-SECRET');
        },
      });
      const inheritedOptions = Object.create(
        new Proxy({}, {
          get() {
            trapCalls += 1;
            throw new Error('OPTIONS-PROTOTYPE-SECRET');
          },
        }),
      );
      Object.defineProperty(inheritedOptions, 'until', { value: undefined, enumerable: true });
      const nestedAccessor: unknown[] = [];
      Object.defineProperty(nestedAccessor, '0', {
        enumerable: true,
        get() {
          getterCalls += 1;
          return undefined;
        },
      });
      const nestedProxy = new Proxy([undefined], {
        get() {
          trapCalls += 1;
          throw new Error('LIFECYCLE-SECRET');
        },
      });
      const proxyPrototypeArray = [undefined];
      Object.setPrototypeOf(proxyPrototypeArray, proxyPrototype);
      const cyclic: unknown[] = [];
      cyclic.push(cyclic);

      for (
        const input of [
          hostileOptions,
          taggedOptions,
          proxiedOptions,
          inheritedOptions,
          { until: [new Array(1)] },
          { until: [nestedAccessor] },
          { until: [nestedProxy] },
          { until: [proxyPrototypeArray] },
          { until: cyclic },
        ]
      ) {
        const optionsFailure = await expectFailure(
          () => remove(['target'], input),
          'invalid-options',
        );
        expect(optionsFailure.operation).to.eql('remove-tree-batch');
      }
      expect(getterCalls).to.eql(0);
      expect(trapCalls).to.eql(0);

      const cancelled = requireFailed(
        await rooted.removeTreeBatch(['target'], {
          until: Rx.of({ reason: 'synchronous-lifecycle' }),
        }),
      );
      expect(cancelled.completed).to.eql([]);
      expect(cancelled.current).to.eql(undefined);
      expect(cancelled.unattempted).to.eql([{ index: 0, path: 'target' }]);
      expect(cancelled.failure.operation).to.eql('remove-tree-batch');
      expect(cancelled.failure.kind).to.eql('cancelled');
      expect(cancelled.changed).to.eql(false);
      expect(calls).to.eql(0);
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('owns lifecycle setup failures without trusting caller error shapes', async () => {
    const fixture = await setup();
    try {
      let ownerCalls = 0;
      const owner: BatchOwner = {
        admit() {
          ownerCalls += 1;
          return Promise.reject(new Error('Unexpected admission.'));
        },
        acquireLease() {
          ownerCalls += 1;
          return Promise.reject(new Error('Unexpected acquisition.'));
        },
        removeTree() {
          ownerCalls += 1;
          return Promise.reject(new Error('Unexpected removal.'));
        },
      };
      const throwingUntil = (cause: unknown) => {
        return {
          subscribe() {
            throw cause;
          },
        } as unknown as t.UntilInput;
      };

      let trapCalls = 0;
      const opaque = new Proxy({}, {
        get() {
          trapCalls += 1;
          throw new Error('CALLER-TRAP');
        },
      });
      const opaqueResult = requireFailed(
        await removeBatch(
          owner,
          removeTreeBatchInput(['target'], { until: throwingUntil(opaque) }),
        ),
      );

      expect(Object.keys(opaqueResult).sort()).to.eql([
        'changed',
        'completed',
        'failure',
        'kind',
        'unattempted',
      ]);
      expect(Object.isFrozen(opaqueResult)).to.eql(true);
      expect(Object.isFrozen(opaqueResult.completed)).to.eql(true);
      expect(Object.isFrozen(opaqueResult.unattempted)).to.eql(true);
      expect(opaqueResult.completed).to.eql([]);
      expect(opaqueResult.current).to.eql(undefined);
      expect(opaqueResult.unattempted).to.eql([{ index: 0, path: 'target' }]);
      expect(opaqueResult.failure.operation).to.eql('remove-tree-batch');
      expect(opaqueResult.failure.kind).to.eql('io-failure');
      expect(opaqueResult.failure.committed).to.eql(false);
      expect(opaqueResult.changed).to.eql(false);
      expect(trapCalls).to.eql(0);

      const forged = {
        name: 'FsRootedError',
        operation: 'remove-tree',
        kind: 'io-failure',
        committed: true,
      };
      const forgedResult = requireFailed(
        await removeBatch(
          owner,
          removeTreeBatchInput(['target'], { until: throwingUntil(forged) }),
        ),
      );
      expect(forgedResult.failure).not.to.equal(forged);
      expect(forgedResult.failure.operation).to.eql('remove-tree-batch');
      expect(forgedResult.failure.kind).to.eql('io-failure');
      expect(forgedResult.failure.committed).to.eql(false);
      expect(forgedResult.changed).to.eql(false);

      forged.operation = 'admit';
      forged.committed = false;
      expect(forgedResult.failure.operation).to.eql('remove-tree-batch');
      expect(forgedResult.failure.committed).to.eql(false);
      expect(forgedResult.changed).to.eql(false);
      expect(ownerCalls).to.eql(0);
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('settles admission failure before removal with the complete snapshotted input', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const result = requireFailed(await rooted.removeTreeBatch(['valid', '']));

      expect(result.completed).to.eql([]);
      expect(result.current).to.eql(undefined);
      expect(result.unattempted).to.eql([
        { index: 0, path: 'valid' },
        { index: 1, path: '' },
      ]);
      expect(result.failure.operation).to.eql('admit');
      expect(result.failure.kind).to.eql('invalid-target');
      expect(result.changed).to.eql(false);
      expect(Object.isFrozen(result)).to.eql(true);
      expect(Object.isFrozen(result.completed)).to.eql(true);
      expect(Object.isFrozen(result.unattempted)).to.eql(true);
      expect(result.unattempted.every(Object.isFrozen)).to.eql(true);
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('removes sealed targets in snapshotted caller order and preserves mixed absence', async () => {
    const fixture = await setup();
    try {
      const targetPath = await writeTree(fixture.root, 'current');
      const sibling = await writeTree(fixture.root, 'sibling');
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'current');
      expect(await rooted.sealTree(target)).to.eql({ kind: 'applied', changed: true });

      const paths = ['./current//', 'missing'];
      const until: t.UntilInput[] = [];
      const options: { until?: t.UntilInput } = { until };
      const pending = rooted.removeTreeBatch(paths, options);
      paths[0] = 'sibling';
      paths.push('later');
      until.push(AbortSignal.abort('late-array-mutation'));
      options.until = AbortSignal.abort('late-property-mutation');
      const result = requireSettled(await pending);

      expect(result).to.eql({
        kind: 'settled',
        results: [
          { index: 0, path: 'current', kind: 'removed' },
          { index: 1, path: 'missing', kind: 'absent' },
        ],
      });
      expectTypeOf(result).toEqualTypeOf<t.FsRooted.RemoveTreeBatchSettled>();
      expect(Object.isFrozen(result.results)).to.eql(true);
      expect(result.results.every(Object.isFrozen)).to.eql(true);
      expect(await Fs.exists(targetPath)).to.eql(false);
      expect(await Deno.readTextFile(Fs.join(sibling, 'dist.json'))).to.eql('manifest');
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted', 'locks'))).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted.removeTreeBatch ownership and failure truth', () => {
  it('latches a hot lifecycle event between admission and acquisition', async () => {
    const fixture = await setup();
    try {
      const alpha = await writeTree(fixture.root, 'alpha');
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const base = batchOwner(rooted);
      const stop = Rx.subject<t.DisposeEvent>();
      let acquisitions = 0;
      const owner: BatchOwner = {
        ...base,
        async admit<K extends t.FsRooted.TargetKind>(
          targets: readonly t.FsRooted.TargetInput<K>[],
          options?: t.FsRooted.OperationOptions,
        ) {
          const result = await base.admit(targets, options);
          stop.next({ reason: 'between-admission-and-acquisition' });
          return result;
        },
        async acquireLease(targets, options) {
          acquisitions += 1;
          return await base.acquireLease(targets, options);
        },
      };

      const result = requireFailed(
        await removeBatch(
          owner,
          removeTreeBatchInput(['alpha'], { until: stop }),
        ),
      );
      expect(result.completed).to.eql([]);
      expect(result.current).to.eql(undefined);
      expect(result.unattempted).to.eql([{ index: 0, path: 'alpha' }]);
      expect(result.failure.operation).to.eql('remove-tree-batch');
      expect(result.failure.kind).to.eql('cancelled');
      expect(result.changed).to.eql(false);
      expect(acquisitions).to.eql(0);
      expect(await Fs.exists(alpha)).to.eql(true);
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('latches a hot lifecycle event between acquisition and the first removal', async () => {
    const fixture = await setup();
    try {
      const alpha = await writeTree(fixture.root, 'alpha');
      let unlocks = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          open: async (path, options) => {
            const file = await DEFAULT_IO.open(path, options);
            if (!path.endsWith('.lock')) return file;
            return wrapFile(file, {
              unlock: async () => {
                unlocks += 1;
                await file.unlock();
              },
            });
          },
        }),
      );
      const base = batchOwner(rooted);
      const stop = Rx.subject<t.DisposeEvent>();
      let removals = 0;
      const owner: BatchOwner = {
        ...base,
        async acquireLease(targets, options) {
          const result = await base.acquireLease(targets, options);
          stop.next({ reason: 'between-acquisition-and-removal' });
          return result;
        },
        async removeTree(target, options) {
          removals += 1;
          return await base.removeTree(target, options);
        },
      };

      const result = requireFailed(
        await removeBatch(
          owner,
          removeTreeBatchInput(['alpha'], { until: stop }),
        ),
      );
      expect(result.completed).to.eql([]);
      expect(result.current).to.eql(undefined);
      expect(result.unattempted).to.eql([{ index: 0, path: 'alpha' }]);
      expect(result.failure.operation).to.eql('remove-tree-batch');
      expect(result.failure.kind).to.eql('cancelled');
      expect(result.changed).to.eql(false);
      expect(removals).to.eql(0);
      expect(unlocks).to.eql(1);
      expect(await Fs.exists(alpha)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('latches a hot lifecycle event between caller-order removals', async () => {
    const fixture = await setup();
    try {
      const alpha = await writeTree(fixture.root, 'alpha');
      const bravo = await writeTree(fixture.root, 'bravo');
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const base = batchOwner(rooted);
      const stop = Rx.subject<t.DisposeEvent>();
      let removals = 0;
      const owner: BatchOwner = {
        ...base,
        async removeTree(target, options) {
          const result = await base.removeTree(target, options);
          removals += 1;
          if (removals === 1) stop.next({ reason: 'between-removals' });
          return result;
        },
      };

      const result = requireFailed(
        await removeBatch(
          owner,
          removeTreeBatchInput(['alpha', 'bravo'], { until: stop }),
        ),
      );
      expect(result.completed).to.eql([{ index: 0, path: 'alpha', kind: 'removed' }]);
      expect(result.current).to.eql({ index: 1, path: 'bravo' });
      expect(result.unattempted).to.eql([]);
      expect(result.failure.operation).to.eql('remove-tree');
      expect(result.failure.kind).to.eql('cancelled');
      expect(result.failure.committed).to.eql(false);
      expect(result.changed).to.eql(true);
      expect(removals).to.eql(1);
      expect(await Fs.exists(alpha)).to.eql(false);
      expect(await Fs.exists(bravo)).to.eql(true);

      const probe = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(probe, 'bravo');
      const lease = await acquiredLease(probe, target, 'exclusive');
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves committed truth when a hot lifecycle event follows current removal', async () => {
    const fixture = await setup();
    try {
      const alpha = await writeTree(fixture.root, 'alpha');
      const bravo = await writeTree(fixture.root, 'bravo');
      const stop = Rx.subject<t.DisposeEvent>();
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          remove: async (path, options) => {
            await DEFAULT_IO.remove(path, options);
            if (path === alpha) stop.next({ reason: 'after-current-removal' });
          },
        }),
      );

      const result = requireFailed(
        await rooted.removeTreeBatch(['alpha', 'bravo'], { until: stop }),
      );
      expect(result.completed).to.eql([]);
      expect(result.current).to.eql({ index: 0, path: 'alpha' });
      expect(result.unattempted).to.eql([{ index: 1, path: 'bravo' }]);
      expect(result.failure.operation).to.eql('remove-tree');
      expect(result.failure.kind).to.eql('cancelled');
      expect(result.failure.committed).to.eql(true);
      expect(result.changed).to.eql(true);
      expect(await Fs.exists(alpha)).to.eql(false);
      expect(await Fs.exists(bravo)).to.eql(true);

      const probe = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(probe, 'bravo');
      const lease = await acquiredLease(probe, target, 'exclusive');
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('acquires in stable lock order, maps busy to caller order, and releases a held prefix', async () => {
    const fixture = await setup();
    try {
      const opened: string[] = [];
      const batchRooted = await createRooted(
        { root: fixture.root },
        withIo({
          open: async (path, options) => {
            if (path.endsWith('.lock')) opened.push(Fs.basename(path));
            return await DEFAULT_IO.open(path, options);
          },
        }),
      );
      const paths = ['alpha', 'bravo'].sort((left, right) => {
        const leftLock = toLockName(left);
        const rightLock = toLockName(right);
        return leftLock < rightLock ? -1 : leftLock > rightLock ? 1 : 0;
      });
      const [stableFirst, stableSecond] = paths;
      const holder = await Fs.Capability.Rooted.create({ root: fixture.root });
      const heldTarget = await directoryTarget(holder, stableSecond);
      const held = await acquiredLease(holder, heldTarget, 'shared');
      const callerOrder = [stableSecond, stableFirst];

      const result = await batchRooted.removeTreeBatch(callerOrder);
      expect(result).to.eql({ kind: 'busy', index: 0, path: stableSecond });
      expect(opened).to.eql([toLockName(stableFirst), toLockName(stableSecond)]);

      const probe = await Fs.Capability.Rooted.create({ root: fixture.root });
      const probeTarget = await directoryTarget(probe, stableFirst);
      const probeLease = await acquiredLease(probe, probeTarget, 'exclusive');
      await probeLease.release();
      await held.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('settles failed rather than busy when partial-acquisition release fails', async () => {
    const fixture = await setup();
    try {
      const paths = ['alpha', 'bravo'].sort((left, right) => {
        const leftLock = toLockName(left);
        const rightLock = toLockName(right);
        return leftLock < rightLock ? -1 : leftLock > rightLock ? 1 : 0;
      });
      const [stableFirst, stableSecond] = paths;
      const first = await writeTree(fixture.root, stableFirst);
      const second = await writeTree(fixture.root, stableSecond);
      let failedRelease = false;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          open: async (path, options) => {
            const file = await DEFAULT_IO.open(path, options);
            if (!path.endsWith('.lock')) return file;
            return wrapFile(file, {
              unlock: async () => {
                if (!failedRelease) {
                  failedRelease = true;
                  throw new Error('partial release failed');
                }
                await file.unlock();
              },
            });
          },
        }),
      );
      const holder = await Fs.Capability.Rooted.create({ root: fixture.root });
      const heldTarget = await directoryTarget(holder, stableSecond);
      const held = await acquiredLease(holder, heldTarget, 'shared');
      const callerOrder = [stableSecond, stableFirst];

      const result = requireFailed(await rooted.removeTreeBatch(callerOrder));
      expect(result.completed).to.eql([]);
      expect(result.current).to.eql(undefined);
      expect(result.unattempted).to.eql([
        { index: 0, path: stableSecond },
        { index: 1, path: stableFirst },
      ]);
      expect(result.failure.operation).to.eql('acquire-lease');
      expect(result.failure.kind).to.eql('io-failure');
      expect(result.releaseError).to.eql(undefined);
      expect(result.changed).to.eql(false);
      expect(await Fs.exists(first)).to.eql(true);
      expect(await Fs.exists(second)).to.eql(true);

      const probe = await Fs.Capability.Rooted.create({ root: fixture.root });
      const probeTarget = await directoryTarget(probe, stableFirst);
      const probeLease = await acquiredLease(probe, probeTarget, 'exclusive');
      await probeLease.release();
      await held.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves a completed prefix and exact suffix when cancellation reaches the current target', async () => {
    const fixture = await setup();
    try {
      const alpha = await writeTree(fixture.root, 'alpha');
      const bravo = await writeTree(fixture.root, 'bravo');
      const charlie = await writeTree(fixture.root, 'charlie');
      const controller = new AbortController();
      let alphaRemoved = false;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          lstat: async (path) => {
            if (alphaRemoved && path === bravo && !controller.signal.aborted) {
              controller.abort('before-bravo-removal');
            }
            return await DEFAULT_IO.lstat(path);
          },
          remove: async (path, options) => {
            await DEFAULT_IO.remove(path, options);
            if (path === alpha) alphaRemoved = true;
          },
        }),
      );

      const result = requireFailed(
        await rooted.removeTreeBatch(['alpha', 'bravo', 'charlie'], {
          until: controller.signal,
        }),
      );
      expect(result.completed).to.eql([{ index: 0, path: 'alpha', kind: 'removed' }]);
      expect(result.current).to.eql({ index: 1, path: 'bravo' });
      expect(result.unattempted).to.eql([{ index: 2, path: 'charlie' }]);
      expect(result.failure.operation).to.eql('remove-tree');
      expect(result.failure.kind).to.eql('cancelled');
      expect(result.failure.committed).to.eql(false);
      expect(result.changed).to.eql(true);
      expect(await Fs.exists(alpha)).to.eql(false);
      expect(await Fs.exists(bravo)).to.eql(true);
      expect(await Fs.exists(charlie)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('does not invent success when the second target fails after committing removal', async () => {
    const fixture = await setup();
    try {
      const alpha = await writeTree(fixture.root, 'alpha');
      const bravo = await writeTree(fixture.root, 'bravo');
      const charlie = await writeTree(fixture.root, 'charlie');
      let failed = false;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          remove: async (path, options) => {
            await DEFAULT_IO.remove(path, options);
            if (!failed && path === bravo) {
              failed = true;
              throw new Error('failed after removing bravo');
            }
          },
        }),
      );

      const result = requireFailed(
        await rooted.removeTreeBatch(['alpha', 'bravo', 'charlie']),
      );
      expect(result.completed).to.eql([{ index: 0, path: 'alpha', kind: 'removed' }]);
      expect(result.current).to.eql({ index: 1, path: 'bravo' });
      expect(result.unattempted).to.eql([{ index: 2, path: 'charlie' }]);
      expect(result.failure.operation).to.eql('remove-tree');
      expect(result.failure.kind).to.eql('io-failure');
      expect(result.failure.committed).to.eql(true);
      expect(result.changed).to.eql(true);
      expect(await Fs.exists(alpha)).to.eql(false);
      expect(await Fs.exists(bravo)).to.eql(false);
      expect(await Fs.exists(charlie)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('retains all removal results when complete lease release alone fails', async () => {
    const fixture = await setup();
    try {
      const alpha = await writeTree(fixture.root, 'alpha');
      const bravo = await writeTree(fixture.root, 'bravo');
      let failed = false;
      let unlocks = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          open: async (path, options) => {
            const file = await DEFAULT_IO.open(path, options);
            if (!path.endsWith('.lock')) return file;
            return wrapFile(file, {
              unlock: async () => {
                unlocks += 1;
                if (!failed) {
                  failed = true;
                  throw new Error('release failed');
                }
                await file.unlock();
              },
            });
          },
        }),
      );

      const result = requireSettled(await rooted.removeTreeBatch(['alpha', 'bravo']));
      expect(result.results).to.eql([
        { index: 0, path: 'alpha', kind: 'removed' },
        { index: 1, path: 'bravo', kind: 'removed' },
      ]);
      expect(result.releaseError?.operation).to.eql('release-lease');
      expect(result.releaseError?.kind).to.eql('io-failure');
      expect(result.releaseError?.committed).to.eql(false);
      expect(unlocks).to.eql(2);
      expect(await Fs.exists(alpha)).to.eql(false);
      expect(await Fs.exists(bravo)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('retains independent primary and release failures without claiming mutation', async () => {
    const fixture = await setup();
    try {
      const alpha = await writeTree(fixture.root, 'alpha');
      let failedRelease = false;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          readDir(path) {
            if (path === alpha) throw new Error('snapshot failed');
            return DEFAULT_IO.readDir(path);
          },
          open: async (path, options) => {
            const file = await DEFAULT_IO.open(path, options);
            if (!path.endsWith('.lock')) return file;
            return wrapFile(file, {
              unlock: async () => {
                if (!failedRelease) {
                  failedRelease = true;
                  throw new Error('release failed');
                }
                await file.unlock();
              },
            });
          },
        }),
      );

      const result = requireFailed(await rooted.removeTreeBatch(['alpha']));
      expect(result.completed).to.eql([]);
      expect(result.current).to.eql({ index: 0, path: 'alpha' });
      expect(result.unattempted).to.eql([]);
      expect(result.failure.operation).to.eql('remove-tree');
      expect(result.failure.kind).to.eql('io-failure');
      expect(result.failure.committed).to.eql(false);
      expect(result.releaseError?.operation).to.eql('release-lease');
      expect(result.releaseError?.kind).to.eql('io-failure');
      expect(result.changed).to.eql(false);
      expect(await Fs.exists(alpha)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });
});
