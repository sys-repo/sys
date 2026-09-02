import { Fs, Is, StartGuiIntrinsic, type t } from '../common.ts';

import type {
  AdmittedGeneration,
  AdmittedGenerationSettlement,
  AdmittedMaterialization,
  IdentityDiagnostics,
} from './t.ts';
import {
  hasExactDataShape,
  type ObjectSnapshot,
  ownData,
  propertyOf,
  snapshotObject,
} from './u.snapshot.ts';
import { isCanonicalIntegrity, refuseIdentity, snapshotVerifiedDist } from './u.source.ts';

const EXISTING_KEYS = [
  'kind',
  'dir',
  'integrity',
  'verification',
  'seal',
  'source',
  'cleanup',
] as const;
const PROMOTED_KEYS = [...EXISTING_KEYS, 'totals'] as const;
const FAILURE_KEYS = ['kind', 'stage', 'reason', 'cleanup'] as const;
const FAILURE_WITH_PUBLICATION_KEYS = [...FAILURE_KEYS, 'publication'] as const;
const MANIFEST_CHECKSUM_FAILURE_KEYS = [...FAILURE_KEYS, 'manifestChecksum'] as const;
const MANIFEST_CHECKSUM_KEYS = ['expected', 'received'] as const;

const FAILURE_STAGES: readonly t.Dist.FailureStage[] = [
  'input',
  'storage',
  'existing-verification',
  'manifest-fetch',
  'manifest-admission',
  'staging',
  'resource-pull',
  'stage-verification',
  'promotion',
  'sealing',
  'final-verification',
];
const FAILURE_REASONS: readonly t.Dist.FailureReason[] = [
  'invalid-input',
  'invalid-policy',
  'cancelled',
  'source-denied',
  'timeout',
  'limit-exceeded',
  'integrity-mismatch',
  'malformed-manifest',
  'resource-failure',
  'verification-failure',
  'filesystem-failure',
  'unsupported',
  'execution-failure',
];
const CLEANUP_OUTCOMES: readonly t.Dist.Cleanup[] = ['not-needed', 'complete', 'pending'];
const FAILED_PUBLICATIONS: readonly t.Dist.FailedPublication[] = ['committed', 'occupied'];

const apply = Reflect.apply;
const freeze = Object.freeze;
const isAbsolutePath = Fs.Path.Is.absolute;

/**
 * Admit one complete materializer settlement before package identity can refuse it.
 * Raw descriptors are observed synchronously and are never dereferenced after this function.
 */
export function admitMaterialization(input: {
  generation: unknown;
  diagnostics: IdentityDiagnostics;
}): AdmittedMaterialization {
  const generation = snapshotObject(input.generation, PROMOTED_KEYS.length);
  if (!generation) refuseIdentity(input.diagnostics);

  const kind = ownData(generation, 'kind');
  if (!kind.ok) refuseIdentity(input.diagnostics);
  if (kind.value === 'failed') {
    const failure = admitFailure(generation, input.diagnostics.integrity);
    if (!failure) refuseIdentity(input.diagnostics);
    return failure;
  }
  if (kind.value !== 'existing' && kind.value !== 'promoted') {
    refuseIdentity(input.diagnostics);
  }

  const keys = kind.value === 'existing' ? EXISTING_KEYS : PROMOTED_KEYS;
  if (!hasExactDataShape(generation, keys)) refuseIdentity(input.diagnostics);

  const dir = ownData(generation, 'dir');
  const integrity = ownData(generation, 'integrity');
  const verificationValue = ownData(generation, 'verification');
  const cleanup = ownData(generation, 'cleanup');
  if (!dir.ok || !integrity.ok || !verificationValue.ok || !cleanup.ok) {
    refuseIdentity(input.diagnostics);
  }
  if (
    !Is.string(dir.value) || StartGuiIntrinsic.stringIncludes(dir.value, '\0') ||
    !apply(isAbsolutePath, undefined, [dir.value]) ||
    integrity.value !== input.diagnostics.integrity || !oneOf(cleanup.value, CLEANUP_OUTCOMES)
  ) {
    refuseIdentity(input.diagnostics);
  }

  return freeze({
    kind: 'generation',
    dir: dir.value,
    cleanup: cleanup.value,
    observedPkg: snapshotVerifiedDist(verificationValue.value, input.diagnostics.integrity)?.pkg,
  });
}

/**
 * Admit package identity only after the safe settlement evidence has been retained.
 */
export function admitGenerationPkg(input: {
  expected: Readonly<t.Pkg>;
  generation: AdmittedGenerationSettlement;
  diagnostics: IdentityDiagnostics;
}): AdmittedGeneration {
  const observed = input.generation.observedPkg;
  if (
    !observed || observed.name !== input.expected.name ||
    observed.version !== input.expected.version
  ) {
    refuseIdentity(input.diagnostics);
  }

  return freeze({
    kind: 'admitted',
    dir: input.generation.dir,
    cleanup: input.generation.cleanup,
  });
}

function admitFailure(
  input: ObjectSnapshot,
  expectedIntegrity: t.StringHash,
): t.Dist.Failed | undefined {
  const stage = ownData(input, 'stage');
  const reason = ownData(input, 'reason');
  const cleanup = ownData(input, 'cleanup');
  if (!stage.ok || !reason.ok || !cleanup.ok) return;
  if (!oneOf(stage.value, FAILURE_STAGES)) return;
  if (!oneOf(reason.value, FAILURE_REASONS)) return;
  if (!oneOf(cleanup.value, CLEANUP_OUTCOMES)) return;

  if (stage.value === 'manifest-fetch' && reason.value === 'integrity-mismatch') {
    if (
      cleanup.value !== 'not-needed' ||
      !hasExactDataShape(input, MANIFEST_CHECKSUM_FAILURE_KEYS)
    ) return;
    const manifestChecksum = ownData(input, 'manifestChecksum');
    if (!manifestChecksum.ok) return;
    const pair = snapshotObject(manifestChecksum.value, MANIFEST_CHECKSUM_KEYS.length);
    if (!pair || !hasExactDataShape(pair, MANIFEST_CHECKSUM_KEYS)) return;
    const expected = ownData(pair, 'expected');
    const received = ownData(pair, 'received');
    if (
      !expected.ok || !received.ok || expected.value !== expectedIntegrity ||
      !isCanonicalIntegrity(expected.value) || !isCanonicalIntegrity(received.value) ||
      received.value === expected.value
    ) return;
    return freeze({
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: 'integrity-mismatch',
      cleanup: 'not-needed',
      manifestChecksum: freeze({
        expected: expected.value,
        received: received.value,
      }),
    });
  }

  const hasPublication = propertyOf(input, 'publication') !== undefined;
  const keys = hasPublication ? FAILURE_WITH_PUBLICATION_KEYS : FAILURE_KEYS;
  if (!hasExactDataShape(input, keys)) return;
  const publication = ownData(input, 'publication');
  let admittedPublication: t.Dist.FailedPublication | undefined;
  if (hasPublication) {
    if (!publication.ok || !oneOf(publication.value, FAILED_PUBLICATIONS)) return;
    admittedPublication = publication.value;
  }

  if (stage.value === 'manifest-fetch') {
    if (reason.value === 'integrity-mismatch') return;
    return freeze({
      kind: 'failed',
      stage: 'manifest-fetch',
      reason: reason.value,
      cleanup: cleanup.value,
      ...(admittedPublication ? { publication: admittedPublication } : {}),
    });
  }
  return freeze({
    kind: 'failed',
    stage: stage.value,
    reason: reason.value,
    cleanup: cleanup.value,
    ...(admittedPublication ? { publication: admittedPublication } : {}),
  });
}

function oneOf<T extends string>(input: unknown, values: readonly T[]): input is T {
  if (!Is.string(input)) return false;
  // Indexed traversal avoids ambient array-iterator authority.
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === input) return true;
  }
  return false;
}
