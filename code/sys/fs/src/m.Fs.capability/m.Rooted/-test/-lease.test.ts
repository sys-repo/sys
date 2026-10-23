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
import { toLockName } from '../u/u.lock.ts';

async function directoryTargets(
  rooted: t.FsRooted.Instance,
  ...paths: readonly string[]
): Promise<readonly t.FsRooted.Target<'directory'>[]> {
  const admission = await rooted.Target.admit(paths.map((path) => ({ kind: 'directory', path })));
  return admission.targets;
}

function acquired(
  result: t.FsRooted.LeaseResult,
): Promise<t.FsRooted.Lease> {
  expect(result.kind).to.eql('acquired');
  if (result.kind !== 'acquired') throw new Error('Expected acquired Rooted lease.');
  return Promise.resolve(result.lease);
}

async function fill(stage: t.FsRooted.Stage, value: string): Promise<void> {
  const admission = await stage.files.Target.admit([{ kind: 'file', path: 'dist.json' }]);
  await stage.files.File.publish(admission.targets[0], new TextEncoder().encode(value));
}

describe('Fs.Capability.Rooted lifecycle leases', () => {
  it('exposes a frozen typed lease with one idempotent release operation', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const [target] = await directoryTargets(rooted, 'generation');
      const targets = [target];
      const options: { mode: t.FsRooted.LeaseMode } = { mode: 'shared' };
      const pending = rooted.Lease.acquire(targets, options);
      targets.length = 0;
      options.mode = 'exclusive';
      const result = await pending;
      expectTypeOf(result).toEqualTypeOf<t.FsRooted.LeaseResult>();
      const lease = await acquired(result);

      expect(Object.isFrozen(lease)).to.eql(true);
      expect(Object.isFrozen(lease.targets)).to.eql(true);
      expect(lease.mode).to.eql('shared');
      expect(lease.targets).to.eql([target]);
      expectTypeOf(lease).toEqualTypeOf<t.FsRooted.Lease>();

      const release = lease.release();
      expect(lease.release()).to.equal(release);
      expect(lease[Symbol.asyncDispose]()).to.equal(release);
      await release;

      const metadataDir = Fs.join(fixture.root, '.sys.rooted');
      const lockDir = Fs.join(metadataDir, 'locks');
      if (Deno.build.os !== 'windows') {
        expect(((await Deno.lstat(metadataDir)).mode ?? 0) & 0o777).to.eql(0o700);
        expect(((await Deno.lstat(lockDir)).mode ?? 0) & 0o777).to.eql(0o700);
      }
      const lockNames: string[] = [];
      for await (const entry of Deno.readDir(lockDir)) lockNames.push(entry.name);
      expect(lockNames.length).to.eql(1);
      const lockPath = Fs.join(lockDir, lockNames[0]);
      const identity = await Deno.lstat(lockPath);
      expect((await Deno.readFile(lockPath)).byteLength).to.eql(0);

      const reacquired = await acquired(
        await rooted.Lease.acquire([target], { mode: 'exclusive' }),
      );
      await reacquired.release();
      const retained = await Deno.lstat(lockPath);
      expect({ dev: retained.dev, ino: retained.ino }).to.eql({
        dev: identity.dev,
        ino: identity.ino,
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('admits shared holders together and refuses every conflicting mode without waiting', async () => {
    const fixture = await setup();
    try {
      const first = await Fs.Capability.Rooted.create({ root: fixture.root });
      const second = await Fs.Capability.Rooted.create({ root: fixture.root });
      const contender = await Fs.Capability.Rooted.create({ root: fixture.root });
      const [firstTarget] = await directoryTargets(first, 'generation');
      const [secondTarget] = await directoryTargets(second, 'generation');
      const [contenderTarget] = await directoryTargets(contender, 'generation');

      const firstLease = await acquired(
        await first.Lease.acquire([firstTarget], { mode: 'shared' }),
      );
      const secondLease = await acquired(
        await second.Lease.acquire([secondTarget], { mode: 'shared' }),
      );

      const exclusiveBusy = await contender.Lease.acquire([contenderTarget], {
        mode: 'exclusive',
      });
      expect(exclusiveBusy).to.eql({ kind: 'busy', target: contenderTarget });
      await firstLease.release();
      expect(await contender.Lease.acquire([contenderTarget], { mode: 'exclusive' })).to.eql({
        kind: 'busy',
        target: contenderTarget,
      });
      await secondLease.release();

      const exclusive = await acquired(
        await contender.Lease.acquire([contenderTarget], { mode: 'exclusive' }),
      );
      expect(await first.Lease.acquire([firstTarget], { mode: 'shared' })).to.eql({
        kind: 'busy',
        target: firstTarget,
      });
      expect(await second.Lease.acquire([secondTarget], { mode: 'exclusive' })).to.eql({
        kind: 'busy',
        target: secondTarget,
      });
      await exclusive.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('waits for contended ownership only when explicitly requested', async () => {
    const fixture = await setup();
    try {
      let observed = () => {};
      let resume = () => {};
      const waiting = new Promise<void>((resolve) => (observed = resolve));
      const resumed = new Promise<void>((resolve) => (resume = resolve));
      const io = withIo({
        wait: async () => {
          observed();
          await resumed;
        },
      });
      const holder = await createRooted({ root: fixture.root }, io);
      const contender = await createRooted({ root: fixture.root }, io);
      const [heldTarget] = await directoryTargets(holder, 'generation');
      const [contenderTarget] = await directoryTargets(contender, 'generation');
      const held = await acquired(
        await holder.Lease.acquire([heldTarget], { mode: 'exclusive' }),
      );

      let settled = false;
      const pending = contender.Lease.acquire([contenderTarget], {
        mode: 'exclusive',
        wait: true,
      }).finally(() => (settled = true));
      await waiting;
      expect(settled).to.eql(false);

      await held.release();
      resume();
      const lease = await acquired(await pending);
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels explicit lease waiting without retaining ownership', async () => {
    const fixture = await setup();
    try {
      const holder = await Fs.Capability.Rooted.create({ root: fixture.root });
      const contender = await Fs.Capability.Rooted.create({ root: fixture.root });
      const [heldTarget] = await directoryTargets(holder, 'generation');
      const [contenderTarget] = await directoryTargets(contender, 'generation');
      const held = await acquired(
        await holder.Lease.acquire([heldTarget], { mode: 'exclusive' }),
      );
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort('cancel-waiting-lease'), 20);
      try {
        await expectFailure(
          () =>
            contender.Lease.acquire([contenderTarget], {
              mode: 'exclusive',
              wait: true,
              until: controller.signal,
            }),
          'cancelled',
        );
      } finally {
        clearTimeout(timer);
        await held.release();
      }

      const retry = await acquired(
        await contender.Lease.acquire([contenderTarget], { mode: 'exclusive' }),
      );
      await retry.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('shares one lock protocol with exclusive stage promotion', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      const io = withIo({
        wait: () => {
          controller.abort('lease-blocked-promotion');
          return Promise.reject(new Error('cancelled lock wait'));
        },
      });
      const holder = await createRooted({ root: fixture.root }, io);
      const writer = await createRooted({ root: fixture.root }, io);
      const [heldTarget] = await directoryTargets(holder, 'generation');
      const [writeTarget] = await directoryTargets(writer, 'generation');
      const lease = await acquired(
        await holder.Lease.acquire([heldTarget], { mode: 'shared' }),
      );
      const blockedStage = await writer.Stage.create();
      await fill(blockedStage, 'blocked');

      await expectFailure(
        () => writer.Stage.promote(blockedStage, writeTarget, { until: controller.signal }),
        'cancelled',
      );
      expect(await Fs.exists(blockedStage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(fixture.root, writeTarget.path))).to.eql(false);

      await lease.release();
      const publishedStage = await writer.Stage.create();
      await fill(publishedStage, 'published');
      expect(await writer.Stage.promote(publishedStage, writeTarget)).to.eql({
        kind: 'published',
      });
    } finally {
      await teardown(fixture);
    }
  });

  it('orders batches by stable lock identity and releases partial acquisition on busy', async () => {
    const fixture = await setup();
    try {
      const opened: string[] = [];
      const io = withIo({
        open: async (path, options) => {
          if (path.endsWith('.lock')) opened.push(Fs.basename(path));
          return await DEFAULT_IO.open(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const [zulu, alpha] = await directoryTargets(rooted, 'zulu', 'alpha');

      const first = await acquired(
        await rooted.Lease.acquire([zulu, alpha], { mode: 'shared' }),
      );
      await first.release();
      const firstOrder = opened.splice(0);
      const second = await acquired(
        await rooted.Lease.acquire([alpha, zulu], { mode: 'shared' }),
      );
      await second.release();
      expect(opened).to.eql(firstOrder);
      expect(firstOrder).to.eql(
        [toLockName(alpha.path), toLockName(zulu.path)].sort(),
      );

      const ordered = [alpha, zulu].sort((a, b) => {
        const left = toLockName(a.path);
        const right = toLockName(b.path);
        return left < right ? -1 : left > right ? 1 : 0;
      });
      const blockerRoot = await Fs.Capability.Rooted.create({ root: fixture.root });
      const [blocked] = await directoryTargets(blockerRoot, ordered[1].path);
      const blocker = await acquired(
        await blockerRoot.Lease.acquire([blocked], { mode: 'exclusive' }),
      );

      const busy = await rooted.Lease.acquire([ordered[1], ordered[0]], { mode: 'exclusive' });
      expect(busy).to.eql({ kind: 'busy', target: ordered[1] });

      const probeRoot = await Fs.Capability.Rooted.create({ root: fixture.root });
      const [probeTarget] = await directoryTargets(probeRoot, ordered[0].path);
      const probe = await acquired(
        await probeRoot.Lease.acquire([probeTarget], { mode: 'exclusive' }),
      );
      await probe.release();
      await blocker.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels acquisition after a held prefix and releases every acquired lock', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      let locks = 0;
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!path.endsWith('.lock')) return file;
          return wrapFile(file, {
            tryLock: async (exclusive) => {
              const result = await file.tryLock(exclusive);
              locks += 1;
              if (locks === 1) controller.abort('lease-prefix');
              return result;
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const targets = await directoryTargets(rooted, 'alpha', 'bravo');
      const preCancelled = new AbortController();
      preCancelled.abort('before-acquisition');
      await expectFailure(
        () => rooted.Lease.acquire(targets, { mode: 'shared', until: preCancelled.signal }),
        'cancelled',
      );
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted'))).to.eql(false);

      await expectFailure(
        () => rooted.Lease.acquire(targets, { mode: 'exclusive', until: controller.signal }),
        'cancelled',
      );

      const retryRoot = await Fs.Capability.Rooted.create({ root: fixture.root });
      const retryTargets = await directoryTargets(retryRoot, 'alpha', 'bravo');
      const retry = await acquired(
        await retryRoot.Lease.acquire(retryTargets, { mode: 'exclusive' }),
      );
      await retry.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('reports unsupported locking and closes every opened file', async () => {
    const fixture = await setup();
    try {
      let closes = 0;
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!path.endsWith('.lock')) return file;
          return wrapFile(file, {
            tryLock: () => Promise.reject(new Deno.errors.NotSupported('advisory lock')),
            close: () => {
              closes += 1;
              file.close();
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const [target] = await directoryTargets(rooted, 'generation');

      await expectFailure(
        () => rooted.Lease.acquire([target], { mode: 'shared' }),
        'unsupported',
      );
      expect(closes).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });

  it('revalidates admitted target ancestry after locking and refuses a symlink replacement', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const targetPath = Fs.join(fixture.root, 'generation');
      await Deno.mkdir(targetPath);
      await Deno.mkdir(fixture.outside);
      const [target] = await directoryTargets(rooted, 'generation');
      await Deno.remove(targetPath);
      await Deno.symlink(fixture.outside, targetPath);

      await expectFailure(
        () => rooted.Lease.acquire([target], { mode: 'exclusive' }),
        'unsafe-filesystem',
      );

      await Deno.remove(targetPath);
      await Deno.mkdir(targetPath);
      const retry = await acquired(
        await rooted.Lease.acquire([target], { mode: 'exclusive' }),
      );
      await retry.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('keeps lock identity outside a target deleted under an exclusive lease', async () => {
    const fixture = await setup();
    try {
      const owner = await Fs.Capability.Rooted.create({ root: fixture.root });
      await Deno.mkdir(Fs.join(fixture.root, 'generation'));
      const [target] = await directoryTargets(owner, 'generation');
      const lease = await acquired(
        await owner.Lease.acquire([target], { mode: 'exclusive' }),
      );

      await Deno.remove(Fs.join(fixture.root, target.path), { recursive: true });
      const contender = await Fs.Capability.Rooted.create({ root: fixture.root });
      const [contenderTarget] = await directoryTargets(contender, 'generation');
      expect(await contender.Lease.acquire([contenderTarget], { mode: 'exclusive' })).to.eql({
        kind: 'busy',
        target: contenderTarget,
      });
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted', 'locks'))).to.eql(true);

      await lease.release();
      const replacement = await acquired(
        await contender.Lease.acquire([contenderTarget], { mode: 'exclusive' }),
      );
      await replacement.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('detects persistent lock replacement while releasing but still drops OS ownership', async () => {
    const fixture = await setup();
    try {
      let lockStats = 0;
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          if (!path.endsWith('.lock')) return info;
          lockStats += 1;
          return lockStats === 3 && info.ino !== null ? { ...info, ino: info.ino + 1 } : info;
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const [target] = await directoryTargets(rooted, 'generation');
      const lease = await acquired(
        await rooted.Lease.acquire([target], { mode: 'exclusive' }),
      );

      await expectFailure(() => lease.release(), 'ownership-lost');

      const retryRoot = await Fs.Capability.Rooted.create({ root: fixture.root });
      const [retryTarget] = await directoryTargets(retryRoot, 'generation');
      const retry = await acquired(
        await retryRoot.Lease.acquire([retryTarget], { mode: 'exclusive' }),
      );
      await retry.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('attempts every lock release and closes ownership when one unlock fails', async () => {
    const fixture = await setup();
    try {
      let closes = 0;
      let unlocks = 0;
      let failed = false;
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!path.endsWith('.lock')) return file;
          return wrapFile(file, {
            unlock: async () => {
              unlocks += 1;
              if (!failed) {
                failed = true;
                throw new Error('unlock failed');
              }
              await file.unlock();
            },
            close: () => {
              closes += 1;
              file.close();
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const targets = await directoryTargets(rooted, 'alpha', 'bravo');
      const lease = await acquired(
        await rooted.Lease.acquire(targets, { mode: 'exclusive' }),
      );

      await expectFailure(() => lease.release(), 'io-failure');
      expect(unlocks).to.eql(2);
      expect(closes).to.eql(2);

      const retryRoot = await Fs.Capability.Rooted.create({ root: fixture.root });
      const retryTargets = await directoryTargets(retryRoot, 'alpha', 'bravo');
      const retry = await acquired(
        await retryRoot.Lease.acquire(retryTargets, { mode: 'exclusive' }),
      );
      await retry.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects empty, duplicate, foreign, non-directory, and malformed lease input', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const foreign = await Fs.Capability.Rooted.create({ root: fixture.root });
      const [target] = await directoryTargets(rooted, 'generation');
      const [foreignTarget] = await directoryTargets(foreign, 'foreign');
      const [composed, decomposed] = await directoryTargets(rooted, 'CAFÉ', 'cafe\u0301');
      const file = (await rooted.Target.admit([{ kind: 'file', path: 'file.txt' }])).targets[0];

      await expectFailure(
        () => rooted.Lease.acquire([], { mode: 'shared' }),
        'invalid-lease',
      );
      await expectFailure(
        () => rooted.Lease.acquire([target, target], { mode: 'shared' }),
        'target-collision',
      );
      await expectFailure(
        () => rooted.Lease.acquire([composed, decomposed], { mode: 'shared' }),
        'target-collision',
      );
      const foreignPending = rooted.Lease.acquire([foreignTarget], { mode: 'shared' });
      const foreignFailure = await expectFailure(() => foreignPending, 'foreign-handle');
      expect(foreignFailure.operation).to.eql('acquire-lease');
      await expectFailure(
        () =>
          rooted.Lease.acquire(
            [file as unknown as t.FsRooted.Target<'directory'>],
            { mode: 'shared' },
          ),
        'invalid-target',
      );
      await expectFailure(
        () =>
          rooted.Lease.acquire([target], {
            mode: 'invalid' as t.FsRooted.LeaseMode,
          }),
        'invalid-lease',
      );
      const invalidUntil = rooted.Lease.acquire([target], {
        mode: 'shared',
        until: 'invalid' as unknown as t.UntilInput,
      });
      const untilFailure = await expectFailure(() => invalidUntil, 'invalid-lease');
      expect(untilFailure.operation).to.eql('acquire-lease');
      await expectFailure(
        () =>
          rooted.Lease.acquire([target], {
            mode: 'shared',
            wait: 'yes' as unknown as boolean,
          }),
        'invalid-lease',
      );
      await expectFailure(
        () =>
          rooted.Lease.acquire(
            [target],
            { mode: 'shared', extra: true } as t.FsRooted.LeaseOptions,
          ),
        'invalid-lease',
      );
      const accessor = Object.defineProperty({}, 'mode', {
        enumerable: true,
        get: () => 'shared',
      }) as t.FsRooted.LeaseOptions;
      await expectFailure(
        () => rooted.Lease.acquire([target], accessor),
        'invalid-lease',
      );
      const hostile = new Proxy([target], {
        get(value, property, receiver) {
          if (property === Symbol.iterator) throw new Error('LEASE-INPUT-SECRET');
          return Reflect.get(value, property, receiver);
        },
      });
      const hostileFailure = await expectFailure(
        () => rooted.Lease.acquire(hostile, { mode: 'shared' }),
        'invalid-lease',
      );
      expect(String(hostileFailure.cause).includes('LEASE-INPUT-SECRET')).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });
});
