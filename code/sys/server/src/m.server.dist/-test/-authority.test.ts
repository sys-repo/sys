import { Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, Num, type t } from '../../-test.ts';
import { Dist } from '../mod.ts';
import { setup, teardown } from './u.fixture.ts';

const encoder = new TextEncoder();

describe('Dist.materialize authority: input and policy', () => {
  it('rejects unknown top-level and nested authority before filesystem or network work', async () => {
    const fixture = await setup();
    try {
      const input = { ...fixture.args(), unexpected: true };
      const result = await Dist.materialize(input as t.ServerDist.MaterializeArgs);
      expect(result).to.eql({
        kind: 'failed',
        stage: 'input',
        reason: 'invalid-input',
        cleanup: 'not-needed',
      });

      const policy = { ...fixture.policy, unexpected: true };
      const nested = await Dist.materialize(fixture.args({
        policy: policy as t.ServerDist.Policy,
      }));
      expect(nested).to.eql({
        kind: 'failed',
        stage: 'input',
        reason: 'invalid-policy',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql([]);
      expect(await Fs.exists(fixture.storeDir)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('reads absent top-level optional authority only when it is an own property', async () => {
    const fixture = await setup();
    try {
      let reads = 0;
      const input = new Proxy(fixture.args(), {
        get(target, property, receiver) {
          if (property === 'credentials' || property === 'until') {
            reads++;
            return property === 'credentials'
              ? { manifest: { accessToken: () => 'Bearer ambient-token' } }
              : undefined;
          }
          return Reflect.get(target, property, receiver);
        },
      });

      const result = await Dist.materialize(input);
      expect(result.kind).to.eql('promoted');
      expect(reads).to.eql(0);
      expect(fixture.authorizations.every((value) => value === null)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('reads absent nested credential authority only when it is an own property', async () => {
    const fixture = await setup();
    try {
      let reads = 0;
      const manifest = new Proxy({}, {
        get(target, property, receiver) {
          if (property === 'accessToken' || property === 'headers') {
            reads++;
            return property === 'accessToken' ? () => 'Bearer ambient-token' : undefined;
          }
          return Reflect.get(target, property, receiver);
        },
      });
      const credentials = new Proxy({ manifest }, {
        get(target, property, receiver) {
          if (property === 'resources') {
            reads++;
            return { accessToken: () => 'Bearer ambient-resource-token' };
          }
          return Reflect.get(target, property, receiver);
        },
      });

      const result = await Dist.materialize(fixture.args({
        credentials: credentials as t.ServerDist.Credentials,
      }));
      expect(result.kind).to.eql('promoted');
      expect(reads).to.eql(0);
      expect(fixture.authorizations.every((value) => value === null)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects Pull accounting overflow before filesystem or network work', async () => {
    const fixture = await setup();
    try {
      const policy: t.ServerDist.Policy = {
        ...fixture.policy,
        resources: {
          ...fixture.policy.resources,
          maxTotalBytes: Num.MAX_INT,
        },
      };
      const result = await Dist.materialize(fixture.args({ policy }));

      expect(result).to.eql({
        kind: 'failed',
        stage: 'input',
        reason: 'invalid-policy',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql([]);
      expect(await Fs.exists(fixture.storeDir)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('snapshots policy authority before the first asynchronous boundary', async () => {
    const fixture = await setup();
    try {
      const args = fixture.args();
      const pending = Dist.materialize(args);
      const policy = args.policy as t.DeepMutable<t.ServerDist.Policy>;
      policy.manifest.maxBytes = 0;
      policy.manifest.sourceOrigins.length = 0;
      policy.resources.maxResources = 0;
      policy.verification.entries = 1;

      const result = await pending;
      expect(result.kind).to.eql('promoted');
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Dist.materialize authority: credentials and origins', () => {
  it('evaluates manifest credentials once on the network path and confines their evidence', async () => {
    const fixture = await setup();
    try {
      let credentials = 0;
      const policy: t.ServerDist.Policy = {
        ...fixture.policy,
        manifest: {
          ...fixture.policy.manifest,
          credentialOrigins: [...fixture.policy.manifest.sourceOrigins],
        },
      };
      const result = await Dist.materialize(fixture.args({
        policy,
        credentials: {
          manifest: { accessToken: () => (credentials++, 'Bearer private-token') },
        },
      }));

      expect(result.kind).to.eql('promoted');
      expect(credentials).to.eql(1);
      expect(fixture.authorizations[0]).to.eql('Bearer private-token');
      expect(fixture.authorizations.slice(1).every((value) => value === null)).to.eql(true);
      expect(JSON.stringify(result)).to.not.include('private-token');
    } finally {
      await teardown(fixture);
    }
  });

  it('strips manifest credentials across an admitted cross-origin redirect', async () => {
    const fixture = await setup();
    const destination = await setup();
    try {
      destination.setManifestBytes(fixture.manifestBytes);
      fixture.redirectManifestTo(destination.manifestUrl);
      const destinationOrigin = new URL(destination.manifestUrl).origin;
      const configuredOrigin = fixture.policy.manifest.sourceOrigins[0];
      const policy: t.ServerDist.Policy = {
        ...fixture.policy,
        manifest: {
          ...fixture.policy.manifest,
          sourceOrigins: [configuredOrigin, destinationOrigin],
          credentialOrigins: [configuredOrigin],
        },
        resources: {
          ...fixture.policy.resources,
          response: {
            ...fixture.policy.resources.response,
            sourceOrigins: [destinationOrigin],
            credentialOrigins: [],
          },
        },
      };
      const result = await Dist.materialize(fixture.args({
        policy,
        credentials: {
          manifest: { accessToken: 'redirect-secret' },
        },
      }));

      expect(result.kind).to.eql('promoted');
      expect(fixture.authorizations).to.eql(['Bearer redirect-secret']);
      expect(destination.authorizations.every((value) => value === null)).to.eql(true);
      expect(JSON.stringify(result)).to.not.include('redirect-secret');
    } finally {
      await teardown(destination);
      await teardown(fixture);
    }
  });

  it('confines resource credentials to asset transport without forwarding them to the manifest', async () => {
    const fixture = await setup();
    try {
      let credentials = 0;
      const policy: t.ServerDist.Policy = {
        ...fixture.policy,
        resources: {
          ...fixture.policy.resources,
          response: {
            ...fixture.policy.resources.response,
            credentialOrigins: [...fixture.policy.resources.response.sourceOrigins],
          },
        },
      };
      const result = await Dist.materialize(fixture.args({
        policy,
        credentials: {
          resources: { accessToken: () => (credentials++, 'Bearer resource-token') },
        },
      }));

      expect(result.kind).to.eql('promoted');
      expect(credentials).to.eql(1);
      expect(fixture.authorizations[0]).to.eql(null);
      expect(
        fixture.authorizations.slice(1).every((value) => value === 'Bearer resource-token'),
      ).to.eql(true);
      expect(JSON.stringify(result)).to.not.include('resource-token');
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects asynchronous credential authority before transport and drains rejection', async () => {
    const fixture = await setup();
    try {
      const accessToken = (() =>
        Promise.reject(new Error('private-rejection'))) as unknown as t.HttpFetch.CreateOptions[
          'accessToken'
        ];
      const result = await Dist.materialize(fixture.args({
        credentials: { manifest: { accessToken } },
      }));

      expect(result).to.eql({
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'invalid-input',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql([]);
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Dist.materialize authority: operation settlement', () => {
  it('rejects a pre-aborted lifecycle as cancellation without transport', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      controller.abort('private-reason');
      const result = await Dist.materialize(fixture.args({ until: controller.signal }));

      expect(result).to.eql({
        kind: 'failed',
        stage: 'storage',
        reason: 'cancelled',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql([]);
      expect(JSON.stringify(result)).to.not.include('private-reason');
    } finally {
      await teardown(fixture);
    }
  });

  it('cancels an in-flight asset operation, waits for settlement, and cleans the private stage', async () => {
    const fixture = await setup();
    try {
      const [path] = fixture.assets.keys();
      const gate = fixture.hold(path);
      const controller = new AbortController();
      const pending = Dist.materialize(fixture.args({ until: controller.signal }));
      await gate.requested;
      controller.abort('private-reason');
      gate.release();
      const result = await pending;

      expect(result).to.eql({
        kind: 'failed',
        stage: 'resource-pull',
        reason: 'cancelled',
        cleanup: 'complete',
      });
      expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
      expect(JSON.stringify(result)).to.not.include('private-reason');
    } finally {
      await teardown(fixture);
    }
  });

  it('fails closed after a truncated asset response and cleans the private stage', async () => {
    const fixture = await setup();
    try {
      const [path] = fixture.assets.keys();
      fixture.respondToAsset((candidate, bytes) => {
        return candidate === path ? new Response(bytes.slice(0, 1)) : undefined;
      });
      const result = await Dist.materialize(fixture.args());

      expect(result).to.eql({
        kind: 'failed',
        stage: 'resource-pull',
        reason: 'integrity-mismatch',
        cleanup: 'complete',
      });
      expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('reports pending cleanup when filesystem authority disappears during asset settlement', async () => {
    const fixture = await setup();
    const [path] = fixture.assets.keys();
    const gate = fixture.hold(path);
    try {
      const pending = Dist.materialize(fixture.args());
      await gate.requested;
      await Deno.rename(fixture.storeDir, `${fixture.storeDir}.moved`);
      gate.release();
      const result = await pending;

      expect(result).to.eql({
        kind: 'failed',
        stage: 'resource-pull',
        reason: 'filesystem-failure',
        cleanup: 'pending',
      });
      expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
    } finally {
      gate.release();
      await teardown(fixture);
    }
  });

  it('classifies a stalled manifest response as bounded timeout without creating a stage', async () => {
    const fixture = await setup();
    const gate = fixture.hold('/dist.json');
    try {
      const policy: t.ServerDist.Policy = {
        ...fixture.policy,
        manifest: { ...fixture.policy.manifest, timeout: 10 },
      };
      const pending = Dist.materialize(fixture.args({ policy }));
      await gate.requested;
      const result = await pending;
      gate.release();

      expect(result).to.eql({
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'timeout',
        cleanup: 'not-needed',
      });
      expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
    } finally {
      gate.release();
      await teardown(fixture);
    }
  });
});

describe('Dist.materialize authority: authenticated admission and verification', () => {
  it('fails closed when manifest bytes race after invocation snapshot', async () => {
    const fixture = await setup();
    const gate = fixture.hold('/dist.json');
    try {
      const args = fixture.args();
      const pending = Dist.materialize(args);
      await gate.requested;
      fixture.setManifestBytes(encoder.encode('{"raced":true}'));
      gate.release();
      const result = await pending;

      expect(result).to.eql({
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'integrity-mismatch',
        cleanup: 'not-needed',
      });
      expect(await Fs.exists(Fs.join(fixture.storeDir, args.integrity))).to.eql(false);
    } finally {
      gate.release();
      await teardown(fixture);
    }
  });

  it('rejects source policy before credential evaluation or manifest transport', async () => {
    const fixture = await setup();
    try {
      let credentials = 0;
      const policy: t.ServerDist.Policy = {
        ...fixture.policy,
        manifest: {
          ...fixture.policy.manifest,
          sourceOrigins: ['https://example.test'],
          credentialOrigins: [],
        },
      };
      const result = await Dist.materialize(fixture.args({
        policy,
        credentials: {
          manifest: { accessToken: () => (credentials++, 'Bearer denied') },
        },
      }));

      expect(result).to.eql({
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'source-denied',
        cleanup: 'not-needed',
      });
      expect(credentials).to.eql(0);
      expect(fixture.calls).to.eql([]);
    } finally {
      await teardown(fixture);
    }
  });

  it('enforces manifest and verification byte limits before decoding or asset transport', async () => {
    const fixture = await setup();
    try {
      const manifestPolicy: t.ServerDist.Policy = {
        ...fixture.policy,
        verification: { ...fixture.policy.verification, manifestBytes: 1 },
      };
      const manifest = await Dist.materialize(fixture.args({ policy: manifestPolicy }));
      expect(manifest).to.eql({
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'limit-exceeded',
        cleanup: 'not-needed',
      });

      fixture.calls.length = 0;
      fixture.authorizations.length = 0;
      const fetchPolicy: t.ServerDist.Policy = {
        ...fixture.policy,
        manifest: { ...fixture.policy.manifest, maxBytes: 1 },
      };
      const oversized = await Dist.materialize(fixture.args({ policy: fetchPolicy }));
      expect(oversized).to.eql({
        kind: 'failed',
        stage: 'manifest-fetch',
        reason: 'limit-exceeded',
        cleanup: 'not-needed',
      });
      expect(fixture.calls).to.eql(['/dist.json']);

      fixture.calls.length = 0;
      fixture.authorizations.length = 0;
      const resourcePolicy: t.ServerDist.Policy = {
        ...fixture.policy,
        verification: { ...fixture.policy.verification, fileBytes: 0 },
      };
      const resource = await Dist.materialize(fixture.args({ policy: resourcePolicy }));
      expect(resource).to.eql({
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

  it('rejects structural entry overflow after canonical admission and before asset transport', async () => {
    const fixture = await setup();
    try {
      const policy: t.ServerDist.Policy = {
        ...fixture.policy,
        verification: { ...fixture.policy.verification, entries: 4 },
      };
      const result = await Dist.materialize(fixture.args({ policy }));

      expect(result).to.eql({
        kind: 'failed',
        stage: 'staging',
        reason: 'limit-exceeded',
        cleanup: 'complete',
      });
      expect(fixture.calls).to.eql(['/dist.json']);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects malformed authenticated JSON without creating a stage', async () => {
    const fixture = await setup();
    try {
      fixture.setManifestBytes(encoder.encode('{"not":'));
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

  it('blocks promotion when strict staged verification rejects self-reported metadata', async () => {
    const fixture = await setup();
    try {
      const dist = fixture.cloneDist();
      dist.hash.digest = Hash.sha256('incorrect-composite-digest');
      fixture.setManifest(dist);
      const result = await Dist.materialize(fixture.args());

      expect(result).to.eql({
        kind: 'failed',
        stage: 'stage-verification',
        reason: 'malformed-manifest',
        cleanup: 'complete',
      });
      expect(fixture.calls.length).to.eql(1 + fixture.assets.size);
      expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects tampered assets and removes the private stage without touching generations', async () => {
    const fixture = await setup();
    try {
      const [path, bytes] = [...fixture.assets.entries()][0];
      fixture.assets.set(path, Uint8Array.from([...bytes, 0]));
      const result = await Dist.materialize(fixture.args());

      expect(result).to.eql({
        kind: 'failed',
        stage: 'resource-pull',
        reason: 'integrity-mismatch',
        cleanup: 'complete',
      });
      expect(await Fs.exists(Fs.join(fixture.storeDir, fixture.integrity))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });
});
