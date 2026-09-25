import { Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, Json, Num, type t } from '../../-test.ts';
import { setup, teardown } from '../../-test/u.fixture.dist.ts';
import { Dist } from '../mod.ts';
import { admitManifestResponse, failed } from '../u.materialize/u.failure.ts';

const encoder = new TextEncoder();
const EXECUTION_FAILURE = { ok: false, reason: 'execution-failure' } as const;

describe('admitManifestResponse', () => {
  it('copies and freezes one admitted manifest checksum mismatch', () => {
    const expected = Hash.sha256('expected');
    const received = Hash.sha256('received');
    const lowerChecksum = { valid: false, expected, received };
    const result = admitManifestResponse(
      { ok: false, status: 412, error: {}, checksum: lowerChecksum },
      expected,
    );

    expect(result).to.eql({
      ok: false,
      reason: 'integrity-mismatch',
      manifestChecksum: { expected, received },
    });
    expect(Reflect.ownKeys(result)).to.eql(['ok', 'reason', 'manifestChecksum']);
    expect(Object.isFrozen(result)).to.eql(true);
    expect(result.ok).to.eql(false);
    if (result.ok || result.reason !== 'integrity-mismatch') return;
    expect(Reflect.ownKeys(result.manifestChecksum)).to.eql(['expected', 'received']);
    expect(Object.isFrozen(result.manifestChecksum)).to.eql(true);
    expect(result.manifestChecksum).to.not.equal(lowerChecksum);
  });

  it('preserves an ordinary status 412 without checksum evidence as a resource failure', () => {
    const result = admitManifestResponse(
      { ok: false, status: 412, error: {}, checksum: undefined },
      Hash.sha256('expected'),
    );

    expect(result).to.eql({ ok: false, reason: 'resource-failure' });
    expect(Reflect.ownKeys(result)).to.eql(['ok', 'reason']);
    expect(Object.isFrozen(result)).to.eql(true);
  });

  it('rejects every omitted required response and checksum field', () => {
    const expected = Hash.sha256('expected');
    const received = Hash.sha256('received');
    const checksum = { valid: false, expected, received };
    const validChecksum = { valid: true, expected, received: expected };
    const invalid: readonly Readonly<{ label: string; response: unknown }>[] = [
      {
        label: 'failure response lacks ok',
        response: { status: 412, error: {}, checksum },
      },
      {
        label: 'failure response lacks status',
        response: { ok: false, error: {}, checksum },
      },
      {
        label: 'failure response lacks error',
        response: { ok: false, status: 412, checksum },
      },
      {
        label: 'failure response lacks checksum',
        response: { ok: false, status: 412, error: {} },
      },
      {
        label: 'checksum lacks valid',
        response: { ok: false, status: 412, error: {}, checksum: { expected, received } },
      },
      {
        label: 'checksum lacks expected',
        response: { ok: false, status: 412, error: {}, checksum: { valid: false, received } },
      },
      {
        label: 'checksum lacks received',
        response: { ok: false, status: 412, error: {}, checksum: { valid: false, expected } },
      },
      {
        label: 'success response lacks data',
        response: {
          ok: true,
          requestedUrl: 'https://example.test/dist.json',
          finalUrl: 'https://example.test/dist.json',
          checksum: validChecksum,
        },
      },
      {
        label: 'success response lacks requestedUrl',
        response: {
          ok: true,
          data: new Blob(),
          finalUrl: 'https://example.test/dist.json',
          checksum: validChecksum,
        },
      },
      {
        label: 'success response lacks finalUrl',
        response: {
          ok: true,
          data: new Blob(),
          requestedUrl: 'https://example.test/dist.json',
          checksum: validChecksum,
        },
      },
      {
        label: 'success response lacks checksum',
        response: {
          ok: true,
          data: new Blob(),
          requestedUrl: 'https://example.test/dist.json',
          finalUrl: 'https://example.test/dist.json',
        },
      },
    ];

    for (const test of invalid) {
      expect({
        label: test.label,
        result: admitManifestResponse(test.response, expected),
      }).to.eql({ label: test.label, result: EXECUTION_FAILURE });
    }
  });

  it('accepts null-prototype records and rejects custom prototypes', () => {
    const expected = Hash.sha256('expected');
    const received = Hash.sha256('received');
    const checksum = Object.assign(Object.create(null), { valid: false, expected, received });
    const error = Object.create(null);
    const response = Object.assign(Object.create(null), {
      ok: false,
      status: 412,
      error,
      checksum,
    });

    expect(admitManifestResponse(response, expected)).to.eql({
      ok: false,
      reason: 'integrity-mismatch',
      manifestChecksum: { expected, received },
    });

    const prototype = Object.freeze({ inherited: true });
    const mismatch = {
      ok: false,
      status: 412,
      error: {},
      checksum: { valid: false, expected, received },
    };
    const invalid = [
      {
        label: 'response has a custom prototype',
        response: Object.assign(Object.create(prototype), mismatch),
      },
      {
        label: 'checksum has a custom prototype',
        response: {
          ...mismatch,
          checksum: Object.assign(Object.create(prototype), mismatch.checksum),
        },
      },
      {
        label: 'error has a custom prototype',
        response: {
          ok: false,
          status: 500,
          error: Object.create(prototype),
          checksum: undefined,
        },
      },
    ];

    for (const test of invalid) {
      expect({
        label: test.label,
        result: admitManifestResponse(test.response, expected),
      }).to.eql({ label: test.label, result: EXECUTION_FAILURE });
    }
  });

  it('rejects accessor and contradictory response evidence without invoking accessors', () => {
    const expected = Hash.sha256('expected');
    const received = Hash.sha256('received');
    const mismatch = () => ({
      ok: false,
      status: 412,
      error: {},
      checksum: { valid: false, expected, received },
    });
    let accessorReads = 0;
    const responseAccessor = (
      key: 'ok' | 'status' | 'error' | 'checksum',
      value: unknown,
    ) =>
      Object.defineProperty(mismatch(), key, {
        get() {
          accessorReads += 1;
          return value;
        },
      });
    const checksumAccessor = (
      key: 'valid' | 'expected' | 'received',
      value: unknown,
    ) => ({
      ...mismatch(),
      checksum: Object.defineProperty(
        { valid: false, expected, received },
        key,
        {
          get() {
            accessorReads += 1;
            return value;
          },
        },
      ),
    });
    const tagged = (input: object) =>
      Object.defineProperty(input, Symbol.toStringTag, {
        get() {
          accessorReads += 1;
          return 'Object';
        },
      });
    const policyAccessor = Object.defineProperty({}, 'policyFailure', {
      get() {
        accessorReads += 1;
        return 'response-timeout';
      },
    });
    const invalid: readonly Readonly<{ label: string; response: unknown }>[] = [
      { label: 'response.ok accessor', response: responseAccessor('ok', false) },
      { label: 'response.status accessor', response: responseAccessor('status', 412) },
      { label: 'response.error accessor', response: responseAccessor('error', {}) },
      {
        label: 'response.checksum accessor',
        response: responseAccessor('checksum', { valid: false, expected, received }),
      },
      { label: 'response Symbol.toStringTag', response: tagged(mismatch()) },
      {
        label: 'checksum.valid accessor',
        response: checksumAccessor('valid', false),
      },
      {
        label: 'checksum.expected accessor',
        response: checksumAccessor('expected', expected),
      },
      {
        label: 'checksum.received accessor',
        response: checksumAccessor('received', received),
      },
      {
        label: 'checksum Symbol.toStringTag',
        response: { ...mismatch(), checksum: tagged(mismatch().checksum) },
      },
      {
        label: 'error.policyFailure accessor',
        response: { ok: false, status: 500, error: policyAccessor, checksum: undefined },
      },
      {
        label: 'error Symbol.toStringTag',
        response: { ...mismatch(), error: tagged({}) },
      },
      {
        label: 'policy failure contradicts checksum mismatch',
        response: { ...mismatch(), error: { policyFailure: 'response-timeout' } },
      },
      {
        label: 'checksum evidence has an extra field',
        response: {
          ...mismatch(),
          checksum: { valid: false, expected, received, extra: true },
        },
      },
      {
        label: 'checksum expected differs from caller pin',
        response: {
          ...mismatch(),
          checksum: { valid: false, expected: Hash.sha256('forged'), received },
        },
      },
      {
        label: 'checksum received is malformed',
        response: {
          ...mismatch(),
          checksum: { valid: false, expected, received: 'sha256-invalid' },
        },
      },
      {
        label: 'checksum received is not canonical lowercase',
        response: {
          ...mismatch(),
          checksum: { valid: false, expected, received: received.toUpperCase() },
        },
      },
      {
        label: 'invalid mismatch reports identical hashes',
        response: {
          ...mismatch(),
          checksum: { valid: false, expected, received: expected },
        },
      },
      {
        label: 'invalid success reports unequal hashes',
        response: { ...mismatch(), checksum: { valid: true, expected, received } },
      },
      {
        label: 'valid checksum contradicts failed response',
        response: {
          ...mismatch(),
          checksum: { valid: true, expected, received: expected },
        },
      },
      {
        label: 'checksum mismatch has non-causal status',
        response: { ...mismatch(), status: 500 },
      },
    ];

    for (const test of invalid) {
      const readsBefore = accessorReads;
      expect({
        label: test.label,
        result: admitManifestResponse(test.response, expected),
      }).to.eql({ label: test.label, result: EXECUTION_FAILURE });
      expect({ label: test.label, accessorReads: accessorReads - readsBefore }).to.eql({
        label: test.label,
        accessorReads: 0,
      });
    }
  });

  it('rejects Proxy response evidence without invoking traps', () => {
    const expected = Hash.sha256('expected');
    const received = Hash.sha256('received');
    let traps = 0;
    const trap = (): never => {
      traps += 1;
      throw new Error('Proxy trap invoked');
    };
    const handler: ProxyHandler<Record<PropertyKey, unknown>> = {
      apply: trap,
      construct: trap,
      defineProperty: trap,
      deleteProperty: trap,
      get: trap,
      getOwnPropertyDescriptor: trap,
      getPrototypeOf: trap,
      has: trap,
      isExtensible: trap,
      ownKeys: trap,
      preventExtensions: trap,
      set: trap,
      setPrototypeOf: trap,
    };
    const checksum = { valid: false, expected, received };
    const mismatch = {
      ok: false,
      status: 412,
      error: {},
      checksum,
    };
    const revoked = Proxy.revocable(mismatch, handler);
    revoked.revoke();
    const invalid = [
      { label: 'all-trap response Proxy', response: new Proxy(mismatch, handler) },
      { label: 'revoked response Proxy', response: revoked.proxy },
      {
        label: 'checksum Proxy',
        response: { ...mismatch, checksum: new Proxy(checksum, handler) },
      },
      {
        label: 'error Proxy',
        response: {
          ok: false,
          status: 500,
          checksum: undefined,
          error: new Proxy({}, handler),
        },
      },
    ];

    for (const test of invalid) {
      const trapsBefore = traps;
      expect({
        label: test.label,
        result: admitManifestResponse(test.response, expected),
      }).to.eql({ label: test.label, result: EXECUTION_FAILURE });
      expect({ label: test.label, traps: traps - trapsBefore }).to.eql({
        label: test.label,
        traps: 0,
      });
    }
  });
});

describe('materialization failure construction', () => {
  it('prevents generic construction of a bare manifest checksum mismatch', () => {
    const result = Reflect.apply(failed, undefined, [
      'manifest-fetch',
      'integrity-mismatch',
    ]);
    expect(result).to.eql({
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'execution-failure',
      cleanup: 'not-needed',
    });
  });
});

describe('Dist.materialize', () => {
  describe('input and policy authority', () => {
    it('rejects unknown top-level and nested authority before filesystem or network work', async () => {
      const fixture = await setup();
      try {
        const input = { ...fixture.args(), unexpected: true };
        const result = await Dist.materialize(input as t.Dist.MaterializeArgs);
        expect(result).to.eql({
          kind: 'failed',
          stage: 'input',
          reason: 'invalid-input',
          cleanup: 'not-needed',
        });

        const policy = { ...fixture.policy, unexpected: true };
        const nested = await Dist.materialize(fixture.args({
          policy: policy as t.Dist.Policy,
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
          credentials: credentials as t.Dist.Credentials,
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
        const policy: t.Dist.Policy = {
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
        const policy = args.policy as t.DeepMutable<t.Dist.Policy>;
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

  describe('credential and origin authority', () => {
    it('evaluates manifest credentials once on the network path and confines their evidence', async () => {
      const fixture = await setup();
      try {
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
            manifest: { accessToken: () => (credentials++, '  private-token  ') },
          },
        }));

        expect(result.kind).to.eql('promoted');
        expect(credentials).to.eql(1);
        expect(fixture.authorizations[0]).to.eql('Bearer private-token');
        expect(fixture.authorizations.slice(1).every((value) => value === null)).to.eql(true);
        expect(Json.stringify(result)).to.not.include('private-token');
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
        const policy: t.Dist.Policy = {
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
        expect(Json.stringify(result)).to.not.include('redirect-secret');
      } finally {
        await destination.dispose();
        await fixture.dispose();
      }
    });

    it('confines resource credentials to asset transport without forwarding them to the manifest', async () => {
      const fixture = await setup();
      try {
        let credentials = 0;
        const policy: t.Dist.Policy = {
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
        expect(Json.stringify(result)).to.not.include('resource-token');
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
        const headers = (() =>
          Promise.reject(
            new Error('private-header-rejection'),
          )) as unknown as t.HttpFetch.Mutate.Headers;

        for (const manifest of [{ accessToken }, { headers }]) {
          const result = await Dist.materialize(fixture.args({ credentials: { manifest } }));
          expect(result).to.eql({
            kind: 'failed',
            stage: 'manifest-fetch',
            reason: 'invalid-input',
            cleanup: 'not-needed',
          });
        }
        expect(fixture.calls).to.eql([]);
      } finally {
        await teardown(fixture);
      }
    });
  });

  describe('operation settlement', () => {
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
        expect(Json.stringify(result)).to.not.include('private-reason');
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
        expect(Json.stringify(result)).to.not.include('private-reason');
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
        const policy: t.Dist.Policy = {
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

  describe('authenticated admission and verification', () => {
    it('fails closed when manifest bytes and caller integrity race after invocation', async () => {
      const fixture = await setup();
      const gate = fixture.hold('/dist.json');
      try {
        const args = { ...fixture.args() };
        const expected = args.integrity;
        const pending = Dist.materialize(args);
        await gate.requested;
        args.integrity = Hash.sha256('mutated-after-invocation');
        const raced = encoder.encode('{"raced":true}');
        fixture.setManifestBytes(raced);
        gate.release();
        const result = await pending;

        expect(result).to.eql({
          kind: 'failed',
          stage: 'manifest-fetch',
          reason: 'integrity-mismatch',
          cleanup: 'not-needed',
          manifestChecksum: {
            expected,
            received: Hash.sha256(raced),
          },
        });
        expect(await Fs.exists(Fs.join(fixture.storeDir, expected))).to.eql(false);
      } finally {
        gate.release();
        await teardown(fixture);
      }
    });

    it('rejects source policy before credential evaluation or manifest transport', async () => {
      const fixture = await setup();
      try {
        let credentials = 0;
        const policy: t.Dist.Policy = {
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
        const manifestPolicy: t.Dist.Policy = {
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
        const fetchPolicy: t.Dist.Policy = {
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
        const resourcePolicy: t.Dist.Policy = {
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
        const policy: t.Dist.Policy = {
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
});
