import { types as NodeTypes } from 'node:util';
import { Fs, Is, type t } from '../common.ts';

export type IdentityDiagnostics = Readonly<{
  manifestUrl: t.StringUrl;
  integrity: t.StringHash;
}>;

export type EvidenceSnapshot = Readonly<{
  authorityReadable: boolean;
  exact: boolean;
  manifestUrl: unknown;
  integrity: unknown;
  expectedPkg: Readonly<t.Pkg> | undefined;
}>;

export type AdmittedGeneration = Readonly<{
  kind: 'admitted';
  dir: t.StringAbsoluteDir;
}>;

export type AdmittedMaterialization = AdmittedGeneration | t.Dist.Failed;

type IdentityError = Error & {
  readonly identity?: Readonly<{
    kind: 'refused';
    manifestUrl: t.StringUrl;
    integrity: t.StringHash;
  }>;
};

type PropertySnapshot = Readonly<{
  enumerable: boolean;
  data: boolean;
  value: unknown;
}>;

type ObjectSnapshot = Readonly<{
  target: object;
  properties: ReadonlyMap<PropertyKey, PropertySnapshot>;
}>;

const SOURCE_KEYS = ['manifestUrl', 'integrity', 'expectedPkg'] as const;
const PKG_KEYS = ['name', 'version'] as const;
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
const VERIFICATION_KEYS = ['integrity', 'dist', 'manifestBytes', 'assets'] as const;
const DIST_KEYS = ['type', 'pkg', 'build', 'hash'] as const;
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

/** Snapshot one complete source descriptor without invoking caller-owned accessors or proxy traps. */
export function snapshotEvidence(input: unknown): EvidenceSnapshot {
  const source = snapshotObject(input);
  if (!source) return EMPTY_EVIDENCE;

  const manifestUrl = ownData(source, 'manifestUrl');
  const integrity = ownData(source, 'integrity');
  const rawExpectedPkg = ownData(source, 'expectedPkg');
  const expectedPkg = rawExpectedPkg.ok
    ? snapshotExpectedPkgValue(rawExpectedPkg.value)
    : undefined;
  const authorityReadable = manifestUrl.ok && integrity.ok;
  const exact = authorityReadable && rawExpectedPkg.ok &&
    hasExactDataShape(source, SOURCE_KEYS) && expectedPkg !== undefined;

  return Object.freeze({
    authorityReadable,
    exact,
    manifestUrl: manifestUrl.ok ? manifestUrl.value : undefined,
    integrity: integrity.ok ? integrity.value : undefined,
    expectedPkg,
  });
}

/** Return the already-copied expected identity or emit the stable refusal. */
export function snapshotExpectedPkg(
  input: EvidenceSnapshot,
  diagnostics: IdentityDiagnostics,
): Readonly<t.Pkg> {
  if (!input.exact || !input.expectedPkg) refuseIdentity(diagnostics);
  return input.expectedPkg;
}

/**
 * Admit one complete materializer settlement and return only copied data used after admission.
 * Raw descriptors are observed synchronously and are never dereferenced after this function.
 */
export function admitGenerationPkg(input: {
  expected: Readonly<t.Pkg>;
  generation: unknown;
  diagnostics: IdentityDiagnostics;
}): AdmittedMaterialization {
  const generation = snapshotObject(input.generation);
  if (!generation) refuseIdentity(input.diagnostics);

  const kind = ownData(generation, 'kind');
  if (!kind.ok) refuseIdentity(input.diagnostics);
  if (kind.value === 'failed') {
    const failure = admitFailure(generation);
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
  if (!dir.ok || !integrity.ok || !verificationValue.ok) refuseIdentity(input.diagnostics);
  if (
    !Is.string(dir.value) || dir.value.includes('\0') || !Fs.Path.Is.absolute(dir.value) ||
    integrity.value !== input.diagnostics.integrity
  ) {
    refuseIdentity(input.diagnostics);
  }

  const verification = snapshotObject(verificationValue.value);
  if (!verification || !hasExactDataShape(verification, VERIFICATION_KEYS)) {
    refuseIdentity(input.diagnostics);
  }
  const verificationIntegrity = ownData(verification, 'integrity');
  const distValue = ownData(verification, 'dist');
  if (
    !verificationIntegrity.ok || verificationIntegrity.value !== input.diagnostics.integrity ||
    !distValue.ok
  ) {
    refuseIdentity(input.diagnostics);
  }

  const dist = snapshotObject(distValue.value);
  if (!dist || !hasExactDataShape(dist, DIST_KEYS)) refuseIdentity(input.diagnostics);
  const pkgValue = ownData(dist, 'pkg');
  if (!pkgValue.ok) refuseIdentity(input.diagnostics);

  const observed = snapshotObservedPkg(pkgValue.value);
  if (
    !observed || observed.name !== input.expected.name ||
    observed.version !== input.expected.version
  ) {
    refuseIdentity(input.diagnostics);
  }

  return Object.freeze({ kind: 'admitted', dir: dir.value as t.StringAbsoluteDir });
}

/** Emit the stable identity refusal without exposing caller-controlled evidence. */
export function refuseIdentity(diagnostics?: IdentityDiagnostics): never {
  throw identityError(diagnostics);
}

const EMPTY_EVIDENCE: EvidenceSnapshot = Object.freeze({
  authorityReadable: false,
  exact: false,
  manifestUrl: undefined,
  integrity: undefined,
  expectedPkg: undefined,
});

function admitFailure(input: ObjectSnapshot): t.Dist.Failed | undefined {
  const hasPublication = input.properties.has('publication');
  const keys = hasPublication ? FAILURE_WITH_PUBLICATION_KEYS : FAILURE_KEYS;
  if (!hasExactDataShape(input, keys)) return;

  const stage = ownData(input, 'stage');
  const reason = ownData(input, 'reason');
  const cleanup = ownData(input, 'cleanup');
  const publication = ownData(input, 'publication');
  if (!stage.ok || !reason.ok || !cleanup.ok) return;
  if (!oneOf(stage.value, FAILURE_STAGES)) return;
  if (!oneOf(reason.value, FAILURE_REASONS)) return;
  if (!oneOf(cleanup.value, CLEANUP_OUTCOMES)) return;
  let admittedPublication: t.Dist.FailedPublication | undefined;
  if (hasPublication) {
    if (!publication.ok || !oneOf(publication.value, FAILED_PUBLICATIONS)) return;
    admittedPublication = publication.value;
  }

  return Object.freeze({
    kind: 'failed',
    stage: stage.value,
    reason: reason.value,
    cleanup: cleanup.value,
    ...(admittedPublication ? { publication: admittedPublication } : {}),
  });
}

function snapshotExpectedPkgValue(input: unknown): Readonly<t.Pkg> | undefined {
  const pkg = snapshotObject(input);
  return pkg && snapshotPkgProperties(pkg);
}

function snapshotObservedPkg(input: unknown): Readonly<t.Pkg> | undefined {
  const pkg = snapshotObject(input);
  if (!pkg) return;
  try {
    if (!Object.isFrozen(pkg.target)) return;
  } catch {
    return;
  }
  return snapshotPkgProperties(pkg);
}

function snapshotPkgProperties(input: ObjectSnapshot): Readonly<t.Pkg> | undefined {
  if (!hasExactDataShape(input, PKG_KEYS)) return;
  const name = ownData(input, 'name');
  const version = ownData(input, 'version');
  if (!name.ok || !version.ok) return;
  if (!Is.string(name.value) || name.value.length === 0) return;
  if (!Is.string(version.value) || version.value.length === 0) return;
  return Object.freeze({ name: name.value, version: version.value }) as Readonly<t.Pkg>;
}

/** Snapshot one direct object without evaluating any owned accessors. */
function snapshotObject(input: unknown): ObjectSnapshot | undefined {
  if (!isDirectObject(input)) return;
  try {
    const properties = new Map<PropertyKey, PropertySnapshot>();
    for (const key of Reflect.ownKeys(input)) {
      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      if (!descriptor) return;
      properties.set(key, {
        enumerable: descriptor.enumerable ?? false,
        data: 'value' in descriptor,
        value: 'value' in descriptor ? descriptor.value : undefined,
      });
    }
    return { target: input, properties };
  } catch {
    return;
  }
}

function isDirectObject(input: unknown): input is object {
  if (!Is.object(input)) return false;
  try {
    return !NodeTypes.isProxy(input) && Object.getPrototypeOf(input) === Object.prototype;
  } catch {
    return false;
  }
}

function ownData(
  input: ObjectSnapshot,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  const property = input.properties.get(key);
  return property?.enumerable && property.data ? { ok: true, value: property.value } : NOT_DATA;
}

const NOT_DATA = { ok: false as const };

function hasExactDataShape(input: ObjectSnapshot, keys: readonly string[]): boolean {
  if (input.properties.size !== keys.length) return false;
  return keys.every((key) => {
    const property = input.properties.get(key);
    return property?.enumerable === true && property.data;
  });
}

function oneOf<T extends string>(input: unknown, values: readonly T[]): input is T {
  return Is.string(input) && values.includes(input as T);
}

function identityError(diagnostics?: IdentityDiagnostics): IdentityError {
  const error = new Error('start:gui refused GUI Dist package identity.') as IdentityError;
  if (diagnostics) {
    Object.defineProperty(error, 'identity', {
      configurable: false,
      enumerable: true,
      value: Object.freeze({
        kind: 'refused' as const,
        manifestUrl: diagnostics.manifestUrl,
        integrity: diagnostics.integrity,
      }),
    });
  }
  return error;
}
