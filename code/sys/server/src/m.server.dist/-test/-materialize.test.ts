import { Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, type t, Time } from '../../-test.ts';
import { Dist } from '../mod.ts';
import { setup, teardown } from './u.fixture.ts';

describe('Dist.materialize: generation identity', () => {
  it('promotes once, returns final-directory evidence, then reuses without network', async () => {
    const fixture = await setup();
    try {
      const promoted = await Dist.materialize(fixture.args());
      expect(promoted.kind).to.eql('promoted');
      if (promoted.kind !== 'promoted') return;

      expect(promoted.dir).to.eql(Fs.join(fixture.storeDir, fixture.integrity));
      expect(promoted.integrity).to.eql(fixture.integrity);
      expect(promoted.verification.integrity).to.eql(fixture.integrity);
      expect(promoted.verification.assets.files).to.eql(fixture.assets.size);
      expect(promoted.cleanup).to.eql('complete');
      expect(promoted.totals.resources).to.eql(fixture.assets.size);
      expect(promoted.source.configuredUrl).to.not.include('?');
      expect(promoted.source.finalUrl).to.not.include('?');
      expect(Object.isFrozen(promoted.verification)).to.eql(true);
      expect(await Fs.exists(Fs.join(promoted.dir, 'dist.json'))).to.eql(true);

      const requests = fixture.calls.length;
      let credentials = 0;
      const existing = await Dist.materialize(fixture.args({
        credentials: {
          manifest: { accessToken: () => (credentials++, 'Bearer unused') },
        },
      }));
      expect(existing.kind).to.eql('existing');
      if (existing.kind !== 'existing') return;
      expect(existing.dir).to.eql(promoted.dir);
      expect(existing.verification.integrity).to.eql(fixture.integrity);
      expect(existing.cleanup).to.eql('not-needed');
      expect(existing.source).to.eql({ configuredUrl: promoted.source.configuredUrl });
      expect(credentials).to.eql(0);
      expect(fixture.calls.length).to.eql(requests);
    } finally {
      await teardown(fixture);
    }
  });

  it('resolves assets from the authenticated final manifest URL', async () => {
    const fixture = await setup();
    try {
      fixture.redirectManifest('/nested');
      const result = await Dist.materialize(fixture.args());
      expect(result.kind).to.eql('promoted');
      if (result.kind !== 'promoted') return;

      expect(fixture.calls.slice(0, 2)).to.eql(['/dist.json', '/nested/dist.json']);
      for (const path of fixture.assets.keys()) {
        const encoded = path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
        expect(fixture.calls).to.include(`/nested${encoded}`);
      }
      expect(result.source.finalUrl).to.match(/\/nested\/dist\.json$/);
      expect(result.source.finalUrl).to.not.include('redirected=private');
    } finally {
      await teardown(fixture);
    }
  });

  it('maps the same authenticated manifest bytes to one generation name across origins', async () => {
    const first = await setup();
    const second = await setup();
    try {
      second.setManifestBytes(first.manifestBytes);
      const [left, right] = await Promise.all([
        Dist.materialize(first.args()),
        Dist.materialize(second.args({ integrity: first.integrity })),
      ]);

      expect(left.kind).to.eql('promoted');
      expect(right.kind).to.eql('promoted');
      if (left.kind !== 'promoted' || right.kind !== 'promoted') return;
      expect(Fs.basename(left.dir)).to.eql(first.integrity);
      expect(Fs.basename(right.dir)).to.eql(first.integrity);
      expect(left.verification.integrity).to.eql(first.integrity);
      expect(right.verification.integrity).to.eql(first.integrity);
      expect(new URL(left.source.finalUrl).origin).to.not.eql(
        new URL(right.source.finalUrl).origin,
      );
    } finally {
      await teardown(second);
      await teardown(first);
    }
  });
});

describe('Dist.materialize: manifest trust and existing generations', () => {
  it('rejects a wrong external manifest pin without publishing a generation', async () => {
    const fixture = await setup();
    try {
      const integrity = Hash.sha256('not-the-manifest');
      const result = await Dist.materialize(fixture.args({ integrity }));
      expect(result).to.eql({
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'integrity-mismatch',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql(['/dist.json']);
      expect(await Fs.exists(Fs.join(fixture.storeDir, integrity))).to.eql(false);
      expect(JSON.stringify(result)).to.not.include(integrity);
    } finally {
      await teardown(fixture);
    }
  });

  it('treats an existing generation without dist.json as occupied and performs no network work', async () => {
    const fixture = await setup();
    try {
      await Deno.mkdir(Fs.join(fixture.storeDir, fixture.integrity), { recursive: true });
      let credentials = 0;
      const policy: t.Dist.Policy = {
        ...fixture.policy,
        manifest: {
          ...fixture.policy.manifest,
          credentialOrigins: [...fixture.policy.manifest.sourceOrigins],
        },
      };
      const result = await Dist.materialize(fixture.args({
        policy,
        credentials: {
          manifest: { accessToken: () => (credentials++, 'secret-token') },
        },
      }));

      expect(result).to.eql({
        kind: 'failed',
        stage: 'existing-verification',
        reason: 'verification-failure',
        cleanup: 'not-needed',
        publication: 'occupied',
      });
      expect(credentials).to.eql(0);
      expect(fixture.calls).to.eql([]);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects an invalid existing generation without credentials or network work', async () => {
    const fixture = await setup();
    try {
      const dir = Fs.join(fixture.storeDir, fixture.integrity);
      await Deno.mkdir(dir, { recursive: true });
      await Deno.writeTextFile(Fs.join(dir, 'dist.json'), '{}');
      let credentials = 0;
      const result = await Dist.materialize(fixture.args({
        credentials: {
          manifest: { accessToken: () => (credentials++, 'Bearer unused') },
        },
      }));

      expect(result).to.eql({
        kind: 'failed',
        stage: 'existing-verification',
        reason: 'integrity-mismatch',
        cleanup: 'not-needed',
        publication: 'occupied',
      });
      expect(credentials).to.eql(0);
      expect(fixture.calls).to.eql([]);
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Dist.materialize: staging and generation isolation', () => {
  it('rejects excess authenticated resources before stage creation or asset transport', async () => {
    const fixture = await setup();
    try {
      const policy: t.Dist.Policy = {
        ...fixture.policy,
        resources: { ...fixture.policy.resources, maxResources: 0 },
      };
      const result = await Dist.materialize(fixture.args({ policy }));
      expect(result).to.eql({
        kind: 'failed',
        stage: 'manifest-admission',
        reason: 'limit-exceeded',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql(['/dist.json']);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects authenticated path escape before asset transport and cleans its stage', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const [path] = Object.keys(dist.hash.parts);
      const part = dist.hash.parts[path];
      delete dist.hash.parts[path];
      dist.hash.parts['../escape.js'] = part;
      fixture.setManifest(dist);

      const result = await Dist.materialize(fixture.args());
      expect(result).to.eql({
        kind: 'failed',
        stage: 'staging',
        reason: 'filesystem-failure',
        cleanup: 'complete',
      });
      expect(fixture.calls).to.eql(['/dist.json']);
      expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects authenticated target collisions before asset transport', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const nested = Object.entries(dist.hash.parts).find(([path]) => path.includes('/'));
      if (!nested) throw new Error('Expected one nested fixture asset.');
      const [path, part] = nested;
      dist.hash.parts[path.slice(0, path.indexOf('/'))] = part;
      fixture.setManifest(dist);

      const result = await Dist.materialize(fixture.args());
      expect(result).to.eql({
        kind: 'failed',
        stage: 'staging',
        reason: 'filesystem-failure',
        cleanup: 'complete',
      });
      expect(fixture.calls).to.eql(['/dist.json']);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects authenticated parts without exact size before asset transport', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      const [path] = Object.keys(dist.hash.parts);
      dist.hash.parts[path] = dist.hash.parts[path].split(':size=')[0] as t.StringHash;
      fixture.setManifest(dist);

      const result = await Dist.materialize(fixture.args());
      expect(result).to.eql({
        kind: 'failed',
        stage: 'manifest-admission',
        reason: 'malformed-manifest',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql(['/dist.json']);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves prior verified generations when a later pinned generation fails', async () => {
    const fixture = await setup();
    try {
      const first = await Dist.materialize(fixture.args());
      expect(first.kind).to.eql('promoted');
      if (first.kind !== 'promoted') return;

      const originalDir = first.dir;
      const dist = fixture.cloneDist();
      dist.hash.digest = Hash.sha256('later-invalid-generation');
      fixture.setManifest(dist);
      const later = await Dist.materialize(fixture.args());

      expect(later.kind).to.eql('failed');
      expect(await Fs.exists(originalDir)).to.eql(true);
      expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Dist.materialize: publication settlement', () => {
  it('preserves verified committed truth when post-publication cleanup remains pending', async () => {
    const fixture = await setup();
    const capability = Fs.Capability as { Rooted: t.FsRooted.Lib };
    const descriptor = Object.getOwnPropertyDescriptor(capability, 'Rooted');
    if (!descriptor) throw new Error('Expected Rooted capability descriptor.');
    const owner = capability.Rooted;
    const cleanupError = rootedFailure(true);
    const replacement: t.FsRooted.Lib = Object.freeze({
      Is: owner.Is,
      create: async (options) => {
        const rooted = await owner.create(options);
        const discardStage: t.FsRooted.Instance['discardStage'] = () => {
          return Promise.reject(rootedFailure(false));
        };
        const promoteStage: t.FsRooted.Instance['promoteStage'] = async (...args) => {
          const result = await rooted.promoteStage(...args);
          return result.kind === 'published' ? Object.freeze({ ...result, cleanupError }) : result;
        };
        return Object.freeze({ ...rooted, discardStage, promoteStage });
      },
    });
    Object.defineProperty(capability, 'Rooted', { ...descriptor, value: replacement });

    try {
      const result = await Dist.materialize(fixture.args());
      expect(result.kind).to.eql('promoted');
      if (result.kind !== 'promoted') return;
      expect(result.dir).to.eql(Fs.join(fixture.storeDir, fixture.integrity));
      expect(result.cleanup).to.eql('pending');
      expect(result.verification.integrity).to.eql(fixture.integrity);
    } finally {
      Object.defineProperty(capability, 'Rooted', descriptor);
      await teardown(fixture);
    }
  });

  it('preserves committed truth when the final generation changes after publication', async () => {
    const fixture = await setup();
    try {
      const dir = Fs.join(fixture.storeDir, fixture.integrity);
      let settled = false;
      const pending = Dist.materialize(fixture.args()).finally(() => (settled = true));
      await waitForPath(dir);
      expect(settled).to.eql(false);
      await Deno.writeTextFile(Fs.join(dir, 'dist.json'), '{}');
      const result = await pending;

      expect(result.kind).to.eql('failed');
      if (result.kind !== 'failed') return;
      expect(result.stage).to.eql('final-verification');
      expect(result.publication).to.eql('committed');
      expect(result.cleanup).to.eql('complete');
      expect(result.verification).to.eql(undefined);
      expect(await Fs.exists(dir)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('does not rewrite a visible published generation as cancelled', async () => {
    const fixture = await setup();
    try {
      const dir = Fs.join(fixture.storeDir, fixture.integrity);
      const controller = new AbortController();
      let settled = false;
      const pending = Dist.materialize(fixture.args({ until: controller.signal })).finally(
        () => (settled = true),
      );
      await waitForPath(dir);
      expect(settled).to.eql(false);
      controller.abort('private-post-publication-reason');
      const result = await pending;

      expect(result.kind).to.eql('promoted');
      if (result.kind !== 'promoted') return;
      expect(result.dir).to.eql(dir);
      expect(result.verification.integrity).to.eql(fixture.integrity);
      expect(JSON.stringify(result)).to.not.include('private-post-publication-reason');
    } finally {
      await teardown(fixture);
    }
  });

  it('reports an invalid concurrent winner as occupied without returning stage evidence', async () => {
    const fixture = await setup();
    const [path] = fixture.assets.keys();
    const gate = fixture.hold(path);
    try {
      const pending = Dist.materialize(fixture.args());
      await gate.requested;
      const dir = Fs.join(fixture.storeDir, fixture.integrity);
      await Deno.mkdir(dir, { recursive: true });
      gate.release();
      const result = await pending;

      expect(result).to.eql({
        kind: 'failed',
        stage: 'final-verification',
        reason: 'verification-failure',
        cleanup: 'complete',
        publication: 'occupied',
      });
      expect(await Fs.exists(dir)).to.eql(true);
      expect(await Fs.exists(Fs.join(dir, 'dist.json'))).to.eql(false);
    } finally {
      gate.release();
      await teardown(fixture);
    }
  });

  it('settles concurrent materializers as one promoted and one freshly verified existing result', async () => {
    const fixture = await setup();
    try {
      const results = await Promise.all([
        Dist.materialize(fixture.args()),
        Dist.materialize(fixture.args()),
      ]);
      expect(results.map((result) => result.kind).sort()).to.eql(['existing', 'promoted']);
      results.forEach((result) => {
        expect(result.kind === 'failed').to.eql(false);
        if (result.kind === 'failed') return;
        expect(result.verification.integrity).to.eql(fixture.integrity);
        expect(result.dir).to.eql(Fs.join(fixture.storeDir, fixture.integrity));
      });
    } finally {
      await teardown(fixture);
    }
  });
});

function rootedFailure(committed: boolean): t.FsRooted.Failure {
  const error = new Error('Rooted test cleanup failure') as t.FsRooted.Failure;
  Object.defineProperties(error, {
    name: { value: 'FsRootedError', enumerable: true },
    operation: { value: 'discard-stage', enumerable: true },
    kind: { value: 'io-failure', enumerable: true },
    committed: { value: committed, enumerable: true },
  });
  return error;
}

async function waitForPath(path: t.StringPath): Promise<void> {
  const startedAt = performance.now();
  while (!(await Fs.exists(path))) {
    if (performance.now() - startedAt > 2000) {
      throw new Error(`Timed out waiting for materialized path: ${path}`);
    }
    await Time.wait(1 as t.Msecs);
  }
}
