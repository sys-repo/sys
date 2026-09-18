import { describe, expect, Fs, it, type t } from '../../-test.ts';
import { type Fixture, setup, teardown } from '../../-test/u.fixture.dist.ts';
import { Dist } from '../mod.ts';

const TARGET = '@sample.foo';

describe('Dist.Generation.open', () => {
  it('prepares a nested store root, materializes cold, and returns exact frozen ownership', async () => {
    const fixture = await setup();
    const root = nestedRoot(fixture);
    let owner: t.Dist.Generation.Owner | undefined;

    try {
      expect(await Fs.exists(root)).to.eql(false);
      const result = await Dist.Generation.open(args(fixture, root));
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;

      const canonicalRoot = await Fs.realPath(root);
      expect(result.generation.kind).to.eql('promoted');
      expect(result.generation.dir).to.eql(
        Fs.join(canonicalRoot, TARGET, fixture.integrity),
      );
      expect(result.owner.store).to.eql({
        root: canonicalRoot,
        target: TARGET,
        dir: Fs.join(canonicalRoot, TARGET),
      });
      expect(Reflect.ownKeys(result)).to.eql(['kind', 'generation', 'owner']);
      expect(Reflect.ownKeys(result.owner)).to.eql([
        'store',
        'release',
        Symbol.asyncDispose,
      ]);
      expect(Reflect.ownKeys(result.owner.store)).to.eql(['root', 'target', 'dir']);
      expect(Object.isFrozen(result)).to.eql(true);
      expect(Object.isFrozen(result.owner)).to.eql(true);
      expect(Object.isFrozen(result.owner.store)).to.eql(true);
      expect(result.owner[Symbol.asyncDispose]).to.equal(result.owner.release);
      expect(result.owner[Symbol.dispose]).to.eql(undefined);
    } finally {
      await owner?.release();
      await teardown(fixture);
    }
  });

  it('materializes beneath a nested admitted target whose parent exists', async () => {
    const fixture = await setup();
    const root = nestedRoot(fixture);
    const selected: t.StringPath = `packages/./${TARGET}`;
    const target: t.StringRelativePath = `packages/${TARGET}`;
    let owner: t.Dist.Generation.Owner | undefined;

    try {
      await Fs.ensureDir(Fs.join(root, 'packages'));
      const result = await Dist.Generation.open({
        ...args(fixture, root),
        store: { root, target: selected },
      });
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;

      const canonicalRoot = await Fs.realPath(root);
      expect(owner.store).to.eql({
        root: canonicalRoot,
        target,
        dir: Fs.join(canonicalRoot, target),
      });
      expect(result.generation.dir).to.eql(
        Fs.join(canonicalRoot, target, fixture.integrity),
      );
    } finally {
      await owner?.release();
      await teardown(fixture);
    }
  });

  it('reuses a warm generation without network while independent shared owners coexist', async () => {
    const fixture = await setup();
    const root = nestedRoot(fixture);
    let first: t.Dist.Generation.Owner | undefined;
    let second: t.Dist.Generation.Owner | undefined;

    try {
      const cold = await Dist.Generation.open(args(fixture, root));
      expect(cold.kind).to.eql('opened');
      if (cold.kind !== 'opened') return;
      first = cold.owner;
      const requests = fixture.calls.length;

      const warm = await Dist.Generation.open(args(fixture, root, {
        credentials: {
          manifest: {
            accessToken() {
              throw new Error('Warm generation requested credentials.');
            },
          },
        },
      }));
      expect(warm.kind).to.eql('opened');
      if (warm.kind !== 'opened') return;
      second = warm.owner;

      expect(warm.generation.kind).to.eql('existing');
      expect(warm.generation.dir).to.eql(cold.generation.dir);
      expect(fixture.calls.length).to.eql(requests);
    } finally {
      await second?.release();
      await first?.release();
      await teardown(fixture);
    }
  });

  it('holds reset-style exclusive ownership until the owner releases', async () => {
    const fixture = await setup();
    const root = nestedRoot(fixture);
    let owner: t.Dist.Generation.Owner | undefined;
    let exclusive: t.FsRooted.Lease | undefined;

    try {
      const result = await Dist.Generation.open(args(fixture, root));
      expect(result.kind).to.eql('opened');
      if (result.kind !== 'opened') return;
      owner = result.owner;

      const rooted = await Fs.Capability.Rooted.create({ root: result.owner.store.root });
      const admission = await rooted.Target.admit([{
        kind: 'directory',
        path: result.owner.store.target,
      }]);
      const target = admission.targets[0];
      expect(await rooted.Lease.acquire([target], { mode: 'exclusive' })).to.eql({
        kind: 'busy',
        target,
      });

      await owner.release();
      const acquired = await rooted.Lease.acquire([target], { mode: 'exclusive' });
      expect(acquired.kind).to.eql('acquired');
      if (acquired.kind === 'acquired') exclusive = acquired.lease;
    } finally {
      await exclusive?.release();
      await owner?.release();
      await teardown(fixture);
    }
  });

  it('preserves an exact nested materialization failure and releases outer ownership', async () => {
    const fixture = await setup();
    const root = nestedRoot(fixture);

    try {
      const result = await Dist.Generation.open(args(fixture, root, {
        manifestUrl: 'https://denied.example/dist.json',
      }));
      expect(result.kind).to.eql('failed');
      if (result.kind !== 'failed' || !result.generation) return;

      expect(result).to.eql({
        kind: 'failed',
        phase: 'materialization',
        generation: {
          kind: 'failed',
          stage: 'manifest-fetch',
          reason: 'source-denied',
          cleanup: 'not-needed',
        },
        ownership: 'released',
      });
      expect(Object.isFrozen(result)).to.eql(true);
      expect(Object.isFrozen(result.generation)).to.eql(true);

      const rooted = await Fs.Capability.Rooted.create({ root: await Fs.realPath(root) });
      const admission = await rooted.Target.admit([{ kind: 'directory', path: TARGET }]);
      const acquired = await rooted.Lease.acquire(admission.targets, { mode: 'exclusive' });
      expect(acquired.kind).to.eql('acquired');
      if (acquired.kind === 'acquired') await acquired.lease.release();
    } finally {
      await teardown(fixture);
    }
  });
});

function nestedRoot(fixture: Fixture): t.StringAbsoluteDir {
  return Fs.join(fixture.storeDir, 'missing', 'nested', 'root');
}

function args(
  fixture: Fixture,
  root: t.StringDir,
  overrides: Partial<t.Dist.Generation.Open.Args> = {},
): t.Dist.Generation.Open.Args {
  return {
    store: { root, target: TARGET },
    manifestUrl: fixture.manifestUrl,
    integrity: fixture.integrity,
    policy: fixture.policy,
    ...overrides,
  };
}
