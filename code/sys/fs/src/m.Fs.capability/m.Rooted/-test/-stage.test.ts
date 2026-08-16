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
  teardown,
  withIo,
  wrapFile,
} from './u.fixture.ts';
import { toLockName } from '../u/u.lock.ts';
import { writeStageManifest as fill } from './u.fixture.stage.ts';
import { directoryTarget } from './u.fixture.target.ts';

describe('Fs.Capability.Rooted stages: publication settlement', () => {
  it('derives one private lock name for common case and Unicode aliases', () => {
    const composed = toLockName('Generations/CAFÉ');
    const decomposed = toLockName('generations/cafe\u0301');

    expect(composed).to.eql(decomposed);
    expect(composed.startsWith('sha256-')).to.eql(true);
    expect(composed.endsWith('.lock')).to.eql(true);
    expect(composed.includes('generations')).to.eql(false);
  });

  it('promotes one owned stage to an absent directory target', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      expect(Fs.dirname(Fs.dirname(stage.path))).to.eql(
        Fs.join(rooted.path, '.sys.rooted', 'stages'),
      );
      await fill(stage, 'manifest');

      expect(await rooted.promoteStage(stage, target)).to.eql({ kind: 'published' });
      expect(await Deno.readTextFile(Fs.join(fixture.root, target.path, 'dist.json'))).to.eql(
        'manifest',
      );
      expect(await Fs.exists(stage.path)).to.eql(false);
      const lockDir = Fs.join(fixture.root, '.sys.rooted', 'locks');
      const locks: Deno.DirEntry[] = [];
      for await (const entry of Deno.readDir(lockDir)) locks.push(entry);
      expect(locks.length).to.eql(1);
      expect(locks[0].isFile).to.eql(true);
      await rooted.discardStage(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('returns occupied without replacing a real existing directory and cleans the loser', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'sha256-generation');
      const destination = Fs.join(fixture.root, target.path);
      await Deno.mkdir(destination, { recursive: true });
      await Deno.writeTextFile(Fs.join(destination, 'winner.txt'), 'winner');

      const stage = await rooted.createStage();
      await fill(stage, 'loser');
      expect(await rooted.promoteStage(stage, target)).to.eql({ kind: 'occupied' });
      expect(await Deno.readTextFile(Fs.join(destination, 'winner.txt'))).to.eql('winner');
      expect(await Fs.exists(Fs.join(destination, 'dist.json'))).to.eql(false);
      expect(await Fs.exists(stage.path)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('leaves an existing empty directory untouched and cleans the loser', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'sha256-generation');
      const destination = Fs.join(fixture.root, target.path);
      await Deno.mkdir(destination, { recursive: true });

      const stage = await rooted.createStage();
      await fill(stage, 'loser');
      expect(await rooted.promoteStage(stage, target)).to.eql({ kind: 'occupied' });
      expect(await Fs.exists(destination)).to.eql(true);
      expect(await Fs.exists(Fs.join(destination, 'dist.json'))).to.eql(false);
      expect(await Fs.exists(stage.path)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('returns occupied even when stage cleanup fails after another writer wins', async () => {
    const fixture = await setup();
    try {
      let raced = false;
      const io = withIo({
        rename: async (_from, to) => {
          await Deno.mkdir(to);
          raced = true;
          throw new Deno.errors.AlreadyExists('race');
        },
        remove: async (path, options) => {
          if (raced && path.includes('.sys.rooted')) throw new Error('cleanup');
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'loser');

      const result = await rooted.promoteStage(stage, target);
      expect(result.kind).to.eql('occupied');
      expect(result.cleanupError?.kind).to.eql('io-failure');
      expect(result.cleanupError?.committed).to.eql(false);
      expect(await Fs.exists(stage.path)).to.eql(true);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('returns one published and one occupied result when Rooted writers race', async () => {
    const fixture = await setup();
    try {
      const a = await Fs.Capability.Rooted.create({ root: fixture.root });
      const b = await Fs.Capability.Rooted.create({ root: fixture.root });
      const targetA = await directoryTarget(a, 'sha256-generation');
      const targetB = await directoryTarget(b, 'sha256-generation');
      const stageA = await a.createStage();
      const stageB = await b.createStage();
      await Promise.all([fill(stageA, 'alpha'), fill(stageB, 'bravo')]);

      const results = await Promise.all([
        a.promoteStage(stageA, targetA),
        b.promoteStage(stageB, targetB),
      ]);
      expect(results.map((result) => result.kind).sort()).to.eql(['occupied', 'published']);
      expect(['alpha', 'bravo']).to.include(
        await Deno.readTextFile(Fs.join(fixture.root, 'sha256-generation', 'dist.json')),
      );
      expect(await Fs.exists(stageA.path)).to.eql(false);
      expect(await Fs.exists(stageB.path)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted stages: private ownership and pre-publication cleanup', () => {
  it('discards only an active stage owned by this instance', async () => {
    const fixture = await setup();
    try {
      const a = await Fs.Capability.Rooted.create({ root: fixture.root });
      const b = await Fs.Capability.Rooted.create({ root: fixture.root });
      const stage = await a.createStage();
      await Deno.mkdir(fixture.outside, { recursive: true });
      await Deno.writeTextFile(Fs.join(fixture.outside, 'keep.txt'), 'keep');

      await expectFailure(() => b.discardStage(stage), 'foreign-handle');
      expect(await Fs.exists(stage.path)).to.eql(true);
      await a.discardStage(stage);
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Deno.readTextFile(Fs.join(fixture.outside, 'keep.txt'))).to.eql('keep');
      await a.discardStage(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels stage construction at its final IO boundary and cleans the container', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      const io = withIo({
        realPath: async (path) => {
          const real = await DEFAULT_IO.realPath(path);
          if (Fs.basename(path) === 'content') controller.abort('stage-ready');
          return real;
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);

      await expectFailure(
        () => rooted.createStage({ until: controller.signal }),
        'cancelled',
      );
      const stages = Fs.join(fixture.root, '.sys.rooted', 'stages');
      const names: string[] = [];
      for await (const entry of Deno.readDir(stages)) names.push(entry.name);
      expect(names).to.eql([]);
    } finally {
      await teardown(fixture);
    }
  });

  it('leaves a stage container untouched when its identity is untrustworthy', async () => {
    const fixture = await setup();
    try {
      const token = 'untrusted-container';
      const container = Fs.join(fixture.root, '.sys.rooted', 'stages', token);
      let removals = 0;
      const io = withIo({
        token: () => token,
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === container ? { ...info, dev: -1 } : info;
        },
        remove: async (path, options) => {
          if (path === container) removals++;
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);

      await expectFailure(() => rooted.createStage(), 'unsupported');
      expect(removals).to.eql(0);
      expect(await Fs.exists(container)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('retains a trusted stage container when descendant identity is untrustworthy', async () => {
    const fixture = await setup();
    try {
      const token = 'untrusted-content';
      const container = Fs.join(fixture.root, '.sys.rooted', 'stages', token);
      const content = Fs.join(container, 'content');
      let removals = 0;
      const io = withIo({
        token: () => token,
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === content ? { ...info, ino: 0.5 } : info;
        },
        remove: async (path, options) => {
          if (path === container) removals++;
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);

      await expectFailure(() => rooted.createStage(), 'unsupported');
      expect(removals).to.eql(0);
      expect(await Fs.exists(container)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('removes a trusted stage container when marker identity is untrustworthy', async () => {
    const fixture = await setup();
    try {
      const token = 'untrusted-marker';
      const container = Fs.join(fixture.root, '.sys.rooted', 'stages', token);
      let removals = 0;
      const io = withIo({
        token: () => token,
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (Fs.basename(path) !== 'owner') return file;
          return wrapFile(file, {
            stat: async () => ({ ...await file.stat(), dev: Num.INFINITY }),
          });
        },
        remove: async (path, options) => {
          if (path === container) removals++;
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);

      await expectFailure(() => rooted.createStage(), 'unsupported');
      expect(removals).to.eql(1);
      expect(await Fs.exists(container)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels before promotion and removes only the owned stage', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'manifest');
      const controller = new AbortController();
      controller.abort('stop');

      await expectFailure(
        () => rooted.promoteStage(stage, target, { until: controller.signal }),
        'cancelled',
      );
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('refuses cleanup after stage ownership evidence changes', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const stage = await rooted.createStage();
      const marker = Fs.join(Fs.dirname(stage.path), 'owner');
      await Deno.writeTextFile(marker, 'foreign');

      await expectFailure(() => rooted.discardStage(stage), 'ownership-lost');
      expect(await Fs.exists(stage.path)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('reports cleanup failure when stage construction cannot clean its owned container', async () => {
    const fixture = await setup();
    try {
      const io = withIo({
        realPath: async (path) => {
          if (Fs.basename(path) === 'content') {
            throw new Deno.errors.NotSupported('child-root');
          }
          return await DEFAULT_IO.realPath(path);
        },
        remove: async (path, options) => {
          if (path.includes('.sys.rooted')) throw new Error('cleanup');
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);

      const failure = await expectFailure(() => rooted.createStage(), 'io-failure');
      expect((failure.cause as Error).message).to.eql('cleanup');
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted stages: cooperative lock boundary', () => {
  it('rejects replacement of the persistent lock-file identity', async () => {
    const fixture = await setup();
    try {
      let lockStats = 0;
      const io = withIo({
        lstat: async (path) => {
          if (path.endsWith('.lock')) lockStats++;
          const info = await DEFAULT_IO.lstat(path);
          if (path.endsWith('.lock') && lockStats === 3 && info.ino !== null) {
            return { ...info, ino: info.ino + 1 };
          }
          return info;
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'manifest');

      await expectFailure(() => rooted.promoteStage(stage, target), 'unsafe-filesystem');
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);

      const retry = await Fs.Capability.Rooted.create({ root: fixture.root });
      const retryTarget = await directoryTarget(retry, 'sha256-generation');
      const retryStage = await retry.createStage();
      await fill(retryStage, 'retry');
      expect(await retry.promoteStage(retryStage, retryTarget)).to.eql({ kind: 'published' });
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects an untrustworthy persistent lock identity before promotion', async () => {
    const fixture = await setup();
    try {
      let renames = 0;
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path.endsWith('.lock') ? { ...info, ino: Num.INFINITY } : info;
        },
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!path.endsWith('.lock')) return file;
          return wrapFile(file, {
            stat: async () => ({ ...await file.stat(), ino: Num.INFINITY }),
          });
        },
        rename: async (from, to) => {
          renames++;
          await DEFAULT_IO.rename(from, to);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'untrusted-lock-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'manifest');

      await expectFailure(() => rooted.promoteStage(stage, target), 'unsupported');
      expect(renames).to.eql(0);
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels while waiting for the cooperative lock and cleans the stage', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!path.endsWith('.lock')) return file;
          return wrapFile(file, { tryLock: () => Promise.resolve(false) });
        },
        wait: () => {
          controller.abort('lock-wait');
          return Promise.reject(new Error('aborted-wait'));
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'manifest');

      await expectFailure(
        () => rooted.promoteStage(stage, target, { until: controller.signal }),
        'cancelled',
      );
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('classifies a lock-wait fault as IO rather than cancellation', async () => {
    const fixture = await setup();
    try {
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!path.endsWith('.lock')) return file;
          return wrapFile(file, { tryLock: () => Promise.resolve(false) });
        },
        wait: () => Promise.reject(new Error('wait')),
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'manifest');

      await expectFailure(() => rooted.promoteStage(stage, target), 'io-failure');
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('fails closed when advisory locking is unsupported and cleans the stage', async () => {
    const fixture = await setup();
    try {
      const io = withIo({
        open: async (path, options) => {
          const file = await DEFAULT_IO.open(path, options);
          if (!path.endsWith('.lock')) return file;
          return wrapFile(file, {
            tryLock: async () => await Promise.reject(new Deno.errors.NotSupported('lock')),
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'manifest');

      await expectFailure(() => rooted.promoteStage(stage, target), 'unsupported');
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted stages: post-publication truth and recovery', () => {
  it('returns published with a cleanup error and allows discardStage to retry', async () => {
    const fixture = await setup();
    try {
      let renamed = false;
      let failCleanup = true;
      const io = withIo({
        rename: async (from, to) => {
          await DEFAULT_IO.rename(from, to);
          renamed = true;
        },
        remove: async (path, options) => {
          if (renamed && path.includes('.sys.rooted') && failCleanup) {
            failCleanup = false;
            throw new Error('cleanup');
          }
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      const container = Fs.dirname(stage.path);
      await fill(stage, 'manifest');

      const result = await rooted.promoteStage(stage, target);
      expect(result.kind).to.eql('published');
      expect(result.cleanupError?.kind).to.eql('io-failure');
      expect(result.cleanupError?.committed).to.eql(true);
      expect(await Fs.exists(container)).to.eql(true);
      await rooted.discardStage(stage);
      expect(await Fs.exists(container)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('retries published cleanup after deleting its owner marker', async () => {
    const fixture = await setup();
    try {
      let renamed = false;
      let marker = '';
      let container = '';
      let markerRemoved = false;
      let failed = false;
      const io = withIo({
        rename: async (from, to) => {
          await DEFAULT_IO.rename(from, to);
          renamed = true;
        },
        remove: async (path, options) => {
          if (renamed && path === container && markerRemoved && !failed) {
            failed = true;
            throw new Error('container removal failed');
          }
          await DEFAULT_IO.remove(path, options);
          if (path === marker) markerRemoved = true;
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      container = Fs.dirname(stage.path);
      marker = Fs.join(container, 'owner');
      await fill(stage, 'manifest');

      const result = await rooted.promoteStage(stage, target);
      expect(result.kind).to.eql('published');
      expect(result.cleanupError?.kind).to.eql('io-failure');
      expect(await Fs.exists(marker)).to.eql(false);
      expect(await Fs.exists(container)).to.eql(true);
      await rooted.discardStage(stage);
      expect(await Fs.exists(container)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('sets committed when cleanup finds that a published stage is no longer owned', async () => {
    const fixture = await setup();
    try {
      let marker = '';
      const io = withIo({
        rename: async (from, to) => {
          await DEFAULT_IO.rename(from, to);
          await Deno.writeTextFile(marker, 'foreign');
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      marker = Fs.join(Fs.dirname(stage.path), 'owner');
      await fill(stage, 'manifest');

      const result = await rooted.promoteStage(stage, target);
      expect(result.kind).to.eql('published');
      expect(result.cleanupError?.kind).to.eql('ownership-lost');
      expect(result.cleanupError?.committed).to.eql(true);
      await expectFailure(() => rooted.discardStage(stage), 'ownership-lost', true);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves published truth when an untrustworthy target identity is observed', async () => {
    const fixture = await setup();
    try {
      let published = '';
      const io = withIo({
        rename: async (from, to) => {
          await DEFAULT_IO.rename(from, to);
          published = to;
        },
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === published ? { ...info, dev: Num.MAX_INT + 1 } : info;
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'untrusted-published-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'manifest');

      const result = await rooted.promoteStage(stage, target);
      expect(result.kind).to.eql('published');
      expect(result.cleanupError?.kind).to.eql('unsafe-filesystem');
      expect(result.cleanupError?.committed).to.eql(true);
      expect(await Deno.readTextFile(Fs.join(fixture.root, target.path, 'dist.json'))).to.eql(
        'manifest',
      );
      await rooted.discardStage(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('returns published when cancellation happens after the directory becomes visible', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      const io = withIo({
        rename: async (from, to) => {
          await DEFAULT_IO.rename(from, to);
          controller.abort('after-rename');
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'sha256-generation');
      const stage = await rooted.createStage();
      await fill(stage, 'manifest');

      const result = await rooted.promoteStage(stage, target, { until: controller.signal });
      expect(result.kind).to.eql('published');
      expect(result.cleanupError?.kind).to.eql('cancelled');
      expect(result.cleanupError?.committed).to.eql(true);
      expect(await Deno.readTextFile(Fs.join(fixture.root, target.path, 'dist.json'))).to.eql(
        'manifest',
      );
    } finally {
      await teardown(fixture);
    }
  });
});
