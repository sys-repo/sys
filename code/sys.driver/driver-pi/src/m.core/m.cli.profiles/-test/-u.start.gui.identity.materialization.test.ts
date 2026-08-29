import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { admitMaterialization, type AdmittedMaterialization } from '../u.start/u.identity.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';

const EXPECTED = START_GUI_SERVICE.source.integrity;
const RECEIVED: t.StringHash = `sha256-${'b'.repeat(64)}`;
const FAILURE_KEYS = ['kind', 'stage', 'reason', 'cleanup', 'manifestChecksum'] as const;
const CHECKSUM_KEYS = ['expected', 'received'] as const;
const EXTRA = Symbol('extra');

type InputRecord = Record<PropertyKey, unknown>;
type Case = readonly [label: string, generation: unknown];

describe('@sys/driver-pi start:gui materialization identity', () => {
  it('admits one exact launcher-correlated mismatch as an owned frozen copy', () => {
    const lowerPair: { expected: t.StringHash; received: t.StringHash } = {
      expected: EXPECTED,
      received: RECEIVED,
    };
    const generation: t.Dist.ManifestChecksumFailed = {
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'integrity-mismatch',
      cleanup: 'not-needed',
      manifestChecksum: lowerPair,
    };
    const typeProof: Extract<AdmittedMaterialization, t.Dist.ManifestChecksumFailed> = generation;
    expectTypeOf(typeProof).toEqualTypeOf<t.Dist.ManifestChecksumFailed>();

    const admitted = admitMaterialization({
      generation,
      diagnostics: START_GUI_SERVICE.source,
    });
    if (
      admitted.kind !== 'failed' || admitted.stage !== 'manifest-fetch' ||
      admitted.reason !== 'integrity-mismatch'
    ) throw new Error('Expected admitted manifest checksum mismatch.');

    expect(admitted).to.eql(generation);
    expect(Reflect.ownKeys(admitted)).to.eql(FAILURE_KEYS);
    expect(Reflect.ownKeys(admitted.manifestChecksum)).to.eql(CHECKSUM_KEYS);
    expect(admitted).not.to.equal(generation);
    expect(Object.isFrozen(admitted)).to.eql(true);
    expect(Object.isFrozen(admitted.manifestChecksum)).to.eql(true);

    lowerPair.expected = `sha256-${'c'.repeat(64)}`;
    lowerPair.received = `sha256-${'d'.repeat(64)}`;
    expect(admitted.manifestChecksum).to.eql({ expected: EXPECTED, received: RECEIVED });
  });

  it('rejects omitted, surplus, forged, malformed, and contradictory evidence', () => {
    const omissions: readonly Case[] = [
      ...FAILURE_KEYS.map((key) => [`missing ${key}`, without(mismatch(), key)] as const),
      ...CHECKSUM_KEYS.map((key) =>
        [
          `missing manifestChecksum.${key}`,
          { ...mismatch(), manifestChecksum: without(checksum(), key) },
        ] as const
      ),
    ];
    const invalid: readonly Case[] = [
      ...omissions,
      ['extra failure string key', { ...mismatch(), extra: true }],
      ['extra failure symbol key', { ...mismatch(), [EXTRA]: true }],
      ['extra failure non-enumerable key', withHiddenKey(mismatch())],
      ['extra checksum string key', {
        ...mismatch(),
        manifestChecksum: { ...checksum(), extra: true },
      }],
      ['extra checksum symbol key', {
        ...mismatch(),
        manifestChecksum: { ...checksum(), [EXTRA]: true },
      }],
      ['extra checksum non-enumerable key', {
        ...mismatch(),
        manifestChecksum: withHiddenKey(checksum()),
      }],
      ['forged expected pin', {
        ...mismatch(),
        manifestChecksum: { expected: `sha256-${'c'.repeat(64)}`, received: RECEIVED },
      }],
      ['identical expected and received', {
        ...mismatch(),
        manifestChecksum: { expected: EXPECTED, received: EXPECTED },
      }],
      ['malformed received hash', {
        ...mismatch(),
        manifestChecksum: { expected: EXPECTED, received: 'sha256-invalid' },
      }],
      ['uppercase received hash', {
        ...mismatch(),
        manifestChecksum: { expected: EXPECTED, received: `sha256-${'B'.repeat(64)}` },
      }],
      ['contradictory stage', { ...mismatch(), stage: 'resource-pull' }],
      ['contradictory reason', { ...mismatch(), reason: 'resource-failure' }],
      ['contradictory cleanup', { ...mismatch(), cleanup: 'complete' }],
      ['contradictory publication', { ...mismatch(), publication: 'committed' }],
      ['null-prototype failure', Object.assign(Object.create(null), mismatch())],
      ['custom-prototype failure', Object.assign(Object.create({}), mismatch())],
      ['null-prototype checksum', {
        ...mismatch(),
        manifestChecksum: Object.assign(Object.create(null), checksum()),
      }],
      ['custom-prototype checksum', {
        ...mismatch(),
        manifestChecksum: Object.assign(Object.create({}), checksum()),
      }],
    ];

    for (const [label, generation] of invalid) expectRefusal(generation, label);

    expect(admitMaterialization({
      generation: {
        kind: 'failed',
        stage: 'resource-pull',
        reason: 'integrity-mismatch',
        cleanup: 'complete',
      },
      diagnostics: START_GUI_SERVICE.source,
    })).to.eql({
      kind: 'failed',
      stage: 'resource-pull',
      reason: 'integrity-mismatch',
      cleanup: 'complete',
    });
  });

  it('rejects accessors and Proxies without invoking caller behavior', () => {
    let accessorReads = 0;
    let proxyTraps = 0;
    const accessor = (target: InputRecord, key: PropertyKey): InputRecord => {
      const value = target[key];
      return Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        get() {
          accessorReads += 1;
          return value;
        },
      });
    };
    const trap = (): never => {
      proxyTraps += 1;
      throw new Error('Proxy trap invoked.');
    };
    const handler: ProxyHandler<InputRecord> = {
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
    const revokedFailure = Proxy.revocable(mismatch(), handler);
    revokedFailure.revoke();
    const revokedChecksum = Proxy.revocable(checksum(), handler);
    revokedChecksum.revoke();
    const hostile: readonly Case[] = [
      ...FAILURE_KEYS.map((key) =>
        [
          `${key} accessor`,
          accessor(mismatch(), key),
        ] as const
      ),
      ...CHECKSUM_KEYS.map((key) =>
        [
          `manifestChecksum.${key} accessor`,
          { ...mismatch(), manifestChecksum: accessor(checksum(), key) },
        ] as const
      ),
      ['failure Symbol.toStringTag accessor', accessor(mismatch(), Symbol.toStringTag)],
      ['checksum Symbol.toStringTag accessor', {
        ...mismatch(),
        manifestChecksum: accessor(checksum(), Symbol.toStringTag),
      }],
      ['all-trap failure Proxy', new Proxy(mismatch(), handler)],
      ['revoked failure Proxy', revokedFailure.proxy],
      ['all-trap checksum Proxy', {
        ...mismatch(),
        manifestChecksum: new Proxy(checksum(), handler),
      }],
      ['revoked checksum Proxy', {
        ...mismatch(),
        manifestChecksum: revokedChecksum.proxy,
      }],
    ];

    for (const [label, generation] of hostile) {
      const before = { accessorReads, proxyTraps };
      expectRefusal(generation, label);
      expect({ accessorReads, proxyTraps }, label).to.eql(before);
    }
  });
});

function checksum(): InputRecord {
  return { expected: EXPECTED, received: RECEIVED };
}

function mismatch(): InputRecord {
  return {
    kind: 'failed',
    stage: 'manifest-fetch',
    reason: 'integrity-mismatch',
    cleanup: 'not-needed',
    manifestChecksum: checksum(),
  };
}

function without(input: InputRecord, key: PropertyKey): InputRecord {
  const copy = { ...input };
  delete copy[key];
  return copy;
}

function withHiddenKey(input: InputRecord): InputRecord {
  return Object.defineProperty({ ...input }, 'hidden', { value: true });
}

function expectRefusal(generation: unknown, label: string): void {
  let error: Error | undefined;
  try {
    admitMaterialization({ generation, diagnostics: START_GUI_SERVICE.source });
  } catch (cause) {
    if (!(cause instanceof Error)) throw cause;
    error = cause;
  }
  if (!error) throw new Error(`Expected materialization identity refusal: ${label}.`);
  expect(error.message, label).to.eql('start:gui refused GUI Dist package identity.');
  expect((error as Error & { identity?: unknown }).identity, label).to.eql({
    kind: 'refused',
    manifestUrl: START_GUI_SERVICE.source.manifestUrl,
    integrity: EXPECTED,
  });
}
