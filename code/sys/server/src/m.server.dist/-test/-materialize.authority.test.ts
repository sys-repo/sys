import { Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, Json, Num, Rx, type t } from '../../-test.ts';
import { setup, teardown } from '../../-test/u.fixture.dist.ts';
import { Dist } from '../mod.ts';
import { admitManifestResponse, failed } from '../u.materialize/u.failure.ts';
import { snapshotInput } from '../u.materialize/u.input.ts';

const encoder = new TextEncoder();
const EXECUTION_FAILURE = { ok: false, reason: 'execution-failure' } as const;

function response() {
  return {
    ok: true,
    checksum: undefined,
    data: new Blob(['{}']),
    requestedUrl: 'https://example.test/dist.json',
    finalUrl: 'https://example.test/dist.json',
  };
}

function rejection(
  stage: t.Dist.FailureStage,
  reason: t.Dist.FailureReason,
  cleanup: t.Dist.Cleanup = 'not-needed',
) {
  return { kind: 'failed', stage, reason, cleanup };
}

describe('admitManifestResponse', () => {
  it('transport success → immutable byte observation, not authenticated manifest evidence', () => {
    const lower = response();
    const result = admitManifestResponse(lower);
    expect(result).to.eql({
      ok: true,
      data: lower.data,
      requestedUrl: lower.requestedUrl,
      finalUrl: lower.finalUrl,
    });
    expect(Object.isFrozen(result)).to.eql(true);
    lower.finalUrl = 'https://changed.test';
    if (!result.ok) throw new Error('Expected admitted response.');
    expect(result.finalUrl).to.eql('https://example.test/dist.json');
  });

  it('ordinary status 412 without byte expectation → resource failure, no fabricated checksum evidence', () => {
    const result = admitManifestResponse({
      ok: false,
      status: 412,
      error: {},
      checksum: undefined,
    });
    expect(result).to.eql({ ok: false, reason: 'resource-failure' });
    expect(Reflect.ownKeys(result)).to.eql(['ok', 'reason']);
    expect(Object.isFrozen(result)).to.eql(true);
  });

  it('omitted required fields, invalid status, and malformed policy evidence → bounded refusal', () => {
    const success = response();
    const failure = { ok: false, status: 500, error: {}, checksum: undefined };
    for (
      const [value, keys] of [
        [success, ['ok', 'data', 'requestedUrl', 'finalUrl', 'checksum']],
        [failure, ['ok', 'status', 'error', 'checksum']],
      ] as const
    ) {
      for (const key of keys) {
        const input: Record<string, unknown> = { ...value };
        delete input[key];
        expect(admitManifestResponse(input), key).to.eql(EXECUTION_FAILURE);
      }
    }
    for (const status of [0, 99, 600, 200.5, NaN, Infinity, '500']) {
      expect(admitManifestResponse({ ...failure, status })).to.eql(EXECUTION_FAILURE);
    }
    expect(admitManifestResponse({ ...failure, error: { policyFailure: 'unknown' } })).to.eql(
      EXECUTION_FAILURE,
    );
    expect(admitManifestResponse({ ...success, data: {} })).to.eql(EXECUTION_FAILURE);
    expect(admitManifestResponse({ ...success, requestedUrl: 1 })).to.eql(EXECUTION_FAILURE);
    expect(admitManifestResponse({ ...success, finalUrl: null })).to.eql(EXECUTION_FAILURE);
  });

  it('null-prototype transport records → admitted; custom prototypes → refused', () => {
    const failure = { ok: false, status: 500, error: Object.create(null), checksum: undefined };
    expect(admitManifestResponse(Object.assign(Object.create(null), failure))).to.eql({
      ok: false,
      reason: 'resource-failure',
    });
    const prototype = { inherited: true };
    expect(admitManifestResponse(Object.assign(Object.create(prototype), failure))).to.eql(
      EXECUTION_FAILURE,
    );
    expect(admitManifestResponse({ ...failure, error: Object.create(prototype) })).to.eql(
      EXECUTION_FAILURE,
    );
  });

  it('accessor, tagged, proxy and revoked transport evidence → no caller code', () => {
    let calls = 0;
    const trap = (): never => {
      calls++;
      throw new Error('Unexpected caller code.');
    };
    const handler = {
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
    const failure = { ok: false, status: 500, error: {}, checksum: undefined };
    const inputs: unknown[] = [];
    for (const value of [response(), failure]) {
      for (const key of Reflect.ownKeys(value)) {
        inputs.push(Object.defineProperty({ ...value }, key, { get: trap }));
      }
      inputs.push(Object.defineProperty({ ...value }, Symbol.toStringTag, { get: trap }));
      inputs.push(new Proxy(value, handler));
      const revoked = Proxy.revocable(value, handler);
      revoked.revoke();
      inputs.push(revoked.proxy);
    }
    inputs.push({ ...failure, error: Object.defineProperty({}, 'policyFailure', { get: trap }) });
    inputs.push({
      ...failure,
      error: Object.defineProperty({}, Symbol.toStringTag, { get: trap }),
    });
    inputs.push({ ...failure, error: new Proxy({}, handler) });
    inputs.push({ ...response(), data: new Proxy(new Blob(), handler) });
    const revokedError = Proxy.revocable({}, handler);
    const revokedBlob = Proxy.revocable(new Blob(), handler);
    revokedError.revoke();
    revokedBlob.revoke();
    inputs.push({ ...failure, error: revokedError.proxy });
    inputs.push({ ...response(), data: revokedBlob.proxy });
    for (const input of inputs) expect(admitManifestResponse(input)).to.eql(EXECUTION_FAILURE);
    expect(calls).to.eql(0);
  });

  it('old, mixed, contradictory or hostile byte-pin evidence → refusal, never a content pin', () => {
    const expected = Hash.sha256('expected');
    const received = Hash.sha256('received');
    let calls = 0;
    const trap = (): never => {
      calls++;
      throw new Error('Unexpected checksum hook.');
    };
    const checksums: unknown[] = [
      { valid: true, expected, received: expected },
      { valid: false, expected, received },
      { valid: true, expected, received },
      { valid: false, expected, received: expected },
      { expected, received },
      { valid: false, expected },
      { valid: false, received },
      { valid: false, expected, received: 'invalid' },
      { valid: false, expected, received: received.toUpperCase() },
      { valid: false, expected, received, extra: true },
      Object.assign(Object.create({ inherited: true }), { valid: false, expected, received }),
      new Proxy({}, {
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
      }),
    ];
    for (const key of ['valid', 'expected', 'received', Symbol.toStringTag]) {
      checksums.push(Object.defineProperty({}, key, { get: trap }));
    }
    for (const checksum of checksums) {
      expect(admitManifestResponse({ ...response(), checksum })).to.eql(EXECUTION_FAILURE);
      for (const status of [412, 500]) {
        expect(admitManifestResponse({ ok: false, status, error: {}, checksum })).to.eql(
          EXECUTION_FAILURE,
        );
      }
    }
    expect(calls).to.eql(0);
  });
});

describe('materialization failure construction', () => {
  it('content mismatch and byte checksum mismatch → distinct sanitized failures', () => {
    for (
      const [stage, reason] of [
        ['manifest-admission', 'pin-mismatch'],
        ['resource-pull', 'checksum-mismatch'],
      ] as const
    ) {
      const result = failed(stage, reason);
      expect(result).to.eql(rejection(stage, reason));
      expect(Object.isFrozen(result)).to.eql(true);
      expect(Reflect.ownKeys(result)).to.eql(['kind', 'stage', 'reason', 'cleanup']);
    }
  });
});

describe('Dist.materialize authority', () => {
  it('unknown top-level and nested authority → refusal before filesystem or network work', async () => {
    const fixture = await setup();
    try {
      const unknownInput = { ...fixture.args(), unexpected: true } as t.Dist.MaterializeArgs;
      const refusedInput = await Dist.materialize(unknownInput);
      expect(refusedInput).to.eql(rejection('input', 'invalid-input'));
      const unknownPolicy = { ...fixture.policy, unexpected: true } as t.Dist.Policy;
      const refusedPolicy = await Dist.materialize(fixture.args({ policy: unknownPolicy }));
      expect(refusedPolicy).to.eql(rejection('input', 'invalid-policy'));
      expect(fixture.calls).to.eql([]);
      expect(await Fs.exists(fixture.storeDir)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('top-level and nested credential proxies → no ambient optional authority or caller traps', async () => {
    const fixture = await setup();
    try {
      let reads = 0;
      const trap = () => {
        reads++;
        return 'Bearer ambient-token';
      };
      const manifest = new Proxy({}, { get: trap });
      const inputs = [
        new Proxy(fixture.args(), { get: trap }),
        fixture.args({ credentials: new Proxy({ manifest }, { get: trap }) }),
        fixture.args({ credentials: { manifest } }),
      ];
      for (const input of inputs) {
        expect(await Dist.materialize(input)).to.eql(rejection('input', 'invalid-input'));
      }
      expect(reads).to.eql(0);
      expect(fixture.calls).to.eql([]);
      expect(await Fs.exists(fixture.storeDir)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('Pull accounting overflow → refusal before filesystem or network work', async () => {
    const fixture = await setup();
    try {
      const policy = {
        ...fixture.policy,
        resources: { ...fixture.policy.resources, maxTotalBytes: Num.MAX_INT },
      };
      expect(await Dist.materialize(fixture.args({ policy }))).to.eql(
        rejection('input', 'invalid-policy'),
      );
      expect(fixture.calls).to.eql([]);
      expect(await Fs.exists(fixture.storeDir)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('nested origin hooks → reject before executing or widening borrowed policy', async () => {
    const fixture = await setup();
    let hooks = 0;
    const verification = { ...fixture.policy.verification, entries: 1 };
    const mutate = () => {
      hooks++;
      verification.entries = 100;
      return new URL(fixture.manifestUrl).origin;
    };
    const accessor = Object.defineProperty([new URL(fixture.manifestUrl).origin], '0', {
      get: mutate,
    });
    const iterator = Object.defineProperty([new URL(fixture.manifestUrl).origin], Symbol.iterator, {
      value: function* () {
        yield mutate();
      },
    });
    const proxy = new Proxy([new URL(fixture.manifestUrl).origin], {
      get() {
        mutate();
        throw new Error('trap');
      },
    });
    const revoked = Proxy.revocable([new URL(fixture.manifestUrl).origin], {});
    revoked.revoke();
    try {
      for (const sourceOrigins of [accessor, iterator, proxy, revoked.proxy]) {
        const policy = {
          ...fixture.policy,
          verification,
          manifest: { ...fixture.policy.manifest, sourceOrigins },
        };
        expect(snapshotInput(fixture.args({ policy }))).to.eql({
          ok: false,
          reason: 'invalid-policy',
        });
        expect(await Dist.materialize(fixture.args({ policy }))).to.eql(
          rejection('input', 'invalid-policy'),
        );
        expect(snapshotInput({ ...fixture.args({ policy }), until: 42 })).to.eql({
          ok: false,
          reason: 'invalid-input',
        });
      }
      expect(hooks).to.eql(0);
      expect(verification.entries).to.eql(1);
      expect(fixture.calls).to.eql([]);
      expect(await Fs.exists(fixture.storeDir)).to.eql(false);
      expect(snapshotInput(fixture.args()).ok).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  for (const initialEntries of [1, 100]) {
    for (const mutate of [false, true]) {
      it(`lifecycle policy capture: entries=${initialEntries}, mutate=${mutate} → original authority`, async () => {
        const fixture = await setup();
        const source = Rx.subject<t.DisposeEvent>();
        const verification = { ...fixture.policy.verification, entries: initialEntries };
        let reads = 0;
        const until = {
          get disposed() {
            reads++;
            if (mutate) verification.entries = initialEntries === 1 ? 100 : 1;
            return false;
          },
          dispose$: source,
        };
        const args = fixture.args({
          policy: { ...fixture.policy, verification },
          until,
        });
        try {
          const captured = snapshotInput(args);
          expect(captured.ok).to.eql(true);
          if (!captured.ok) throw new Error('Expected admitted input.');
          expect(captured.value.policy.verification.entries).to.eql(initialEntries);
          expect(Object.isFrozen(captured.value.policy.verification)).to.eql(true);
          verification.entries = initialEntries;
          const result = await Dist.materialize(args);
          expect(reads).to.be.greaterThan(0);
          expect(verification.entries).to.eql(
            mutate ? (initialEntries === 1 ? 100 : 1) : initialEntries,
          );
          if (initialEntries === 1) {
            expect(result).to.eql(rejection('manifest-admission', 'limit-exceeded'));
            expect(fixture.calls).to.eql(['/dist.json']);
          } else {
            expect(result.kind).to.eql('promoted');
            expect(fixture.calls.length).to.eql(1 + fixture.assets.size);
          }
        } finally {
          source.complete();
          await teardown(fixture);
        }
      });
    }
  }

  for (const initiallyMatching of [false, true]) {
    it(`direct lifecycle nested pin mutation, initially ${initiallyMatching ? 'matching' : 'wrong'} → original pin`, async () => {
      const fixture = await setup();
      const source = Rx.subject<t.DisposeEvent>();
      const wrong = { ...fixture.pin, digest: `sha256-${'0'.repeat(64)}` };
      const pin = { ...(initiallyMatching ? fixture.pin : wrong) };
      let reads = 0;
      const until = {
        get disposed() {
          reads++;
          pin.digest = initiallyMatching ? wrong.digest : fixture.pin.digest;
          return false;
        },
        dispose$: source,
      };
      try {
        const result = await Dist.materialize(fixture.args({ pin, until }));
        expect(reads).to.be.greaterThan(0);
        expect(pin.digest).to.eql(initiallyMatching ? wrong.digest : fixture.pin.digest);
        if (initiallyMatching) {
          expect(result.kind).to.eql('promoted');
          if (result.kind === 'failed') throw new Error('Expected original matching pin.');
          expect(result.pin).to.eql(fixture.pin);
        } else {
          expect(result).to.eql(rejection('manifest-admission', 'pin-mismatch'));
          expect(fixture.calls).to.eql(['/dist.json']);
        }
      } finally {
        source.complete();
        await teardown(fixture);
      }
    });
  }

  it('policy and nested pin mutation after invocation → original captured authority', async () => {
    const fixture = await setup();
    try {
      const args = { ...fixture.args(), pin: { ...fixture.pin } };
      const pending = Dist.materialize(args);
      args.pin.digest = Hash.sha256('retarget');
      const policy = args.policy as t.DeepMutable<t.Dist.Policy>;
      policy.manifest.maxBytes = 0;
      policy.manifest.sourceOrigins.length = 0;
      policy.resources.maxResources = 0;
      policy.verification.entries = 1;
      const result = await pending;
      expect(result.kind).to.eql('promoted');
      if (result.kind !== 'promoted') throw new Error(Json.stringify(result));
      expect(result.pin).to.eql(fixture.pin);
    } finally {
      await teardown(fixture);
    }
  });

  it('manifest credentials → evaluated once, confined to manifest transport and absent from evidence', async () => {
    const fixture = await setup();
    try {
      let credentials = 0;
      const policy = {
        ...fixture.policy,
        manifest: {
          ...fixture.policy.manifest,
          credentialOrigins: [...fixture.policy.manifest.sourceOrigins],
        },
      };
      const result = await Dist.materialize(
        fixture.args({
          policy,
          credentials: { manifest: { accessToken: () => (credentials++, '  private-token  ') } },
        }),
      );
      expect(result.kind).to.eql('promoted');
      expect(credentials).to.eql(1);
      expect(fixture.authorizations[0]).to.eql('Bearer private-token');
      expect(fixture.authorizations.slice(1).every((value) => value === null)).to.eql(true);
      expect(Json.stringify(result)).not.to.include('private-token');
    } finally {
      await teardown(fixture);
    }
  });

  it('admitted cross-origin redirect → manifest credentials stripped', async () => {
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
      const result = await Dist.materialize(
        fixture.args({ policy, credentials: { manifest: { accessToken: 'redirect-secret' } } }),
      );
      expect(result.kind).to.eql('promoted');
      expect(fixture.authorizations).to.eql(['Bearer redirect-secret']);
      expect(destination.authorizations.every((value) => value === null)).to.eql(true);
      expect(Json.stringify(result)).not.to.include('redirect-secret');
    } finally {
      await teardown(destination);
      await teardown(fixture);
    }
  });

  it('resource credentials → asset transport only, never manifest transport', async () => {
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
      const result = await Dist.materialize(
        fixture.args({
          policy,
          credentials: {
            resources: { accessToken: () => (credentials++, 'Bearer resource-token') },
          },
        }),
      );
      expect(result.kind).to.eql('promoted');
      expect(credentials).to.eql(1);
      expect(fixture.authorizations[0]).to.eql(null);
      expect(fixture.authorizations.slice(1).every((value) => value === 'Bearer resource-token')).to
        .eql(true);
      expect(Json.stringify(result)).not.to.include('resource-token');
    } finally {
      await teardown(fixture);
    }
  });

  it('asynchronous credential authority → refusal before transport, rejection drained', async () => {
    const fixture = await setup();
    try {
      const rejectToken = () => Promise.reject(new Error('private-rejection'));
      const rejectHeaders = () => Promise.reject(new Error('private-header-rejection'));
      const accessToken = rejectToken as unknown as t.HttpFetch.CreateOptions['accessToken'];
      const headers = rejectHeaders as unknown as t.HttpFetch.Mutate.Headers;
      for (const manifest of [{ accessToken }, { headers }]) {
        const args = fixture.args({ credentials: { manifest } });
        const result = await Dist.materialize(args);
        expect(result).to.eql(rejection('manifest-fetch', 'invalid-input'));
      }
      expect(fixture.calls).to.eql([]);
    } finally {
      await teardown(fixture);
    }
  });

  it('source policy denial → no credential evaluation or manifest transport', async () => {
    const fixture = await setup();
    try {
      let credentials = 0;
      const policy = {
        ...fixture.policy,
        manifest: {
          ...fixture.policy.manifest,
          sourceOrigins: ['https://example.test'],
          credentialOrigins: [],
        },
      };
      const args = fixture.args({
        policy,
        credentials: { manifest: { accessToken: () => (credentials++, 'Bearer denied') } },
      });
      const result = await Dist.materialize(args);
      expect(result).to.eql(rejection('manifest-fetch', 'source-denied'));
      expect(credentials).to.eql(0);
      expect(fixture.calls).to.eql([]);
    } finally {
      await teardown(fixture);
    }
  });

  it('pre-aborted lifecycle → cancellation without transport or leaked cause', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      controller.abort('private-reason');
      const result = await Dist.materialize(fixture.args({ until: controller.signal }));
      expect(result).to.eql(rejection('storage', 'cancelled'));
      expect(fixture.calls).to.eql([]);
      expect(Json.stringify(result)).not.to.include('private-reason');
    } finally {
      await teardown(fixture);
    }
  });

  it('in-flight asset cancellation → settlement and private-stage cleanup', async () => {
    const fixture = await setup();
    const gate = fixture.hold('/index.html');
    try {
      const controller = new AbortController();
      const pending = Dist.materialize(fixture.args({ until: controller.signal }));
      await gate.requested;
      controller.abort('private-reason');
      gate.release();
      const result = await pending;
      expect(result).to.eql(rejection('resource-pull', 'cancelled', 'complete'));
      expect(await Fs.exists(fixture.generationDir)).to.eql(false);
      expect(Json.stringify(result)).not.to.include('private-reason');
    } finally {
      gate.release();
      await teardown(fixture);
    }
  });

  for (const change of ['truncated', 'enlarged'] as const) {
    it(`${change} asset response → checksum refusal and private-stage cleanup`, async () => {
      const fixture = await setup();
      try {
        fixture.respondToAsset((path, bytes) =>
          path === '/index.html'
            ? new Response(
              change === 'truncated' ? bytes.slice(0, 1) : Uint8Array.from([...bytes, 0]),
            )
            : undefined
        );
        expect(await Dist.materialize(fixture.args())).to.eql(
          rejection('resource-pull', 'checksum-mismatch', 'complete'),
        );
        expect(await Fs.exists(fixture.generationDir)).to.eql(false);
      } finally {
        await teardown(fixture);
      }
    });
  }

  it('filesystem authority disappears during asset settlement → pending cleanup, never hidden residue', async () => {
    const fixture = await setup();
    const gate = fixture.hold('/index.html');
    try {
      const pending = Dist.materialize(fixture.args());
      await gate.requested;
      await Deno.rename(fixture.storeDir, `${fixture.storeDir}.moved`);
      gate.release();
      expect(await pending).to.eql(rejection('resource-pull', 'filesystem-failure', 'pending'));
      expect(await Fs.exists(fixture.generationDir)).to.eql(false);
    } finally {
      gate.release();
      await teardown(fixture);
    }
  });

  it('stalled manifest response → bounded timeout, no stage', async () => {
    const fixture = await setup();
    const gate = fixture.hold('/dist.json');
    try {
      const policy = { ...fixture.policy, manifest: { ...fixture.policy.manifest, timeout: 10 } };
      const pending = Dist.materialize(fixture.args({ policy }));
      await gate.requested;
      const result = await pending;
      gate.release();
      expect(result).to.eql(rejection('manifest-fetch', 'timeout'));
      expect(await Fs.exists(fixture.generationDir)).to.eql(false);
    } finally {
      gate.release();
      await teardown(fixture);
    }
  });

  it('manifest bytes and caller pin race → retained expectation, no malformed-document authority', async () => {
    const fixture = await setup();
    const gate = fixture.hold('/dist.json');
    try {
      const args = { ...fixture.args(), pin: { ...fixture.pin } };
      const pending = Dist.materialize(args);
      await gate.requested;
      args.pin.digest = Hash.sha256('retarget');
      fixture.setManifestBytes(encoder.encode('{"raced":true}'));
      gate.release();
      expect(await pending).to.eql(rejection('manifest-admission', 'malformed-manifest'));
      expect(await Fs.exists(fixture.generationDir)).to.eql(false);
    } finally {
      gate.release();
      await teardown(fixture);
    }
  });

  it('manifest ceiling capture → stricter acquisition budget without mutating caller policy', async () => {
    const fixture = await setup();
    try {
      for (const [maxBytes, manifestBytes] of [[64, 8], [8, 64]]) {
        const policy = {
          ...fixture.policy,
          manifest: { ...fixture.policy.manifest, maxBytes },
          verification: { ...fixture.policy.verification, manifestBytes },
        };
        const captured = snapshotInput(fixture.args({ policy }));
        expect(captured.ok).to.eql(true);
        if (!captured.ok) throw new Error('Expected admitted input.');
        expect(captured.value.policy.manifest.maxBytes).to.eql(8);
        expect(captured.value.policy.verification.manifestBytes).to.eql(manifestBytes);
        expect(Object.isFrozen(captured.value.policy.manifest)).to.eql(true);
        expect(policy.manifest.maxBytes).to.eql(maxBytes);
        expect(policy.verification.manifestBytes).to.eql(manifestBytes);
      }
      expect(fixture.calls).to.eql([]);
    } finally {
      await teardown(fixture);
    }
  });

  it('manifest, file and structural entry limits → refusal before asset transport', async () => {
    const fixture = await setup();
    try {
      for (
        const [policy, stage] of [
          [{
            ...fixture.policy,
            verification: { ...fixture.policy.verification, manifestBytes: 1 },
          }, 'manifest-fetch'],
          [
            { ...fixture.policy, manifest: { ...fixture.policy.manifest, maxBytes: 1 } },
            'manifest-fetch',
          ],
          [
            { ...fixture.policy, verification: { ...fixture.policy.verification, fileBytes: 0 } },
            'manifest-admission',
          ],
          [
            { ...fixture.policy, verification: { ...fixture.policy.verification, entries: 4 } },
            'manifest-admission',
          ],
        ] as const
      ) {
        fixture.calls.length = 0;
        expect(await Dist.materialize(fixture.args({ policy }))).to.eql(
          rejection(stage, 'limit-exceeded'),
        );
        expect(fixture.calls).to.eql(['/dist.json']);
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('malformed JSON and forged self-reported digest → no stage, asset request or publication', async () => {
    const fixture = await setup();
    try {
      const forged = fixture.cloneDist();
      forged.hash.digest = Hash.sha256('incorrect-content-digest');
      for (const bytes of [encoder.encode('{"not":'), encoder.encode(Json.stringify(forged))]) {
        fixture.setManifestBytes(bytes);
        fixture.calls.length = 0;
        expect(await Dist.materialize(fixture.args())).to.eql(
          rejection('manifest-admission', 'malformed-manifest'),
        );
        expect(fixture.calls).to.eql(['/dist.json']);
        expect(await Fs.exists(fixture.generationDir)).to.eql(false);
      }
    } finally {
      await teardown(fixture);
    }
  });
});
