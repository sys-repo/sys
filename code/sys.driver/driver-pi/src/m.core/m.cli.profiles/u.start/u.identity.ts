import { Fs, Is, StartGuiIntrinsic, type t } from './common.ts';
import { createOwnedError } from './u.error.ts';
import { AUTHORITY_LIMITS } from './u.limits.ts';
import { type CapturedUrl, captureUrl } from './u.url.ts';

export type IdentityDiagnostics = Readonly<{
  manifestUrl: t.StringUrl;
  integrity: t.StringHash;
}>;

export type EvidenceSnapshot = Readonly<{
  kind: 'release' | 'development' | undefined;
  authorityReadable: boolean;
  exact: boolean;
  manifestUrl: unknown;
  dir: unknown;
  integrity: unknown;
  expectedPkg: Readonly<t.Pkg> | undefined;
}>;

export type AdmittedGenerationSettlement = Readonly<{
  kind: 'generation';
  dir: t.StringAbsoluteDir;
  cleanup: t.Dist.Cleanup;
  observedPkg: Readonly<t.Pkg> | undefined;
}>;

export type AdmittedGeneration = Readonly<{
  kind: 'admitted';
  dir: t.StringAbsoluteDir;
  cleanup: t.Dist.Cleanup;
}>;

export type AdmittedMaterialization = AdmittedGenerationSettlement | t.Dist.Failed;

export type IdentityError = Error & {
  readonly identity?: Readonly<{
    kind: 'refused';
    manifestUrl: t.StringUrl;
    integrity: t.StringHash;
  }>;
};

export type ApplicationOwner = Readonly<{
  close(reason?: unknown): Promise<void>;
}>;

export type AdmittedApplicationOwner = ApplicationOwner & Readonly<{ origin: t.StringUrl }>;

export type ApplicationIdentityExpectation = Readonly<{
  integrity: t.StringHash;
  expectedPkg: Readonly<t.Pkg>;
  diagnostics?: IdentityDiagnostics;
}>;

export type ApplicationOwnerSnapshot =
  | Readonly<{
    kind: 'admitted';
    owner: AdmittedApplicationOwner;
    finished: Promise<void>;
  }>
  | Readonly<{
    kind: 'refused';
    owner: ApplicationOwner;
    finished: Promise<void>;
  }>
  | Readonly<{
    kind: 'invalid';
    owner?: ApplicationOwner;
    finished?: Promise<void>;
  }>;

type PropertySnapshot = Readonly<{
  key: PropertyKey;
  enumerable: boolean;
  data: boolean;
  value: unknown;
}>;

type ObjectSnapshot = Readonly<{
  target: object;
  properties: readonly PropertySnapshot[];
}>;

const RELEASE_SOURCE_KEYS = ['kind', 'manifestUrl', 'integrity', 'expectedPkg'] as const;
const DEVELOPMENT_SOURCE_KEYS = ['kind', 'dir', 'integrity', 'expectedPkg'] as const;
const PKG_KEYS = ['name', 'version'] as const;
const LISTENER_ADDRESS_KEYS = ['transport', 'hostname', 'port'] as const;
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
const HOST_AUTHORITY_KEYS = ['kind', 'integrity'] as const;
const APPLIED_BROWSER_POLICY_KEYS = [
  'kind',
  'origin',
  'host',
  'dedicatedWorkers',
  'serviceWorker',
  'fetchMetadata',
  'headers',
] as const;
const SERVICE_WORKER_KEYS = ['kind', 'path'] as const;
const FETCH_METADATA_KEYS = ['crossSite', 'missing'] as const;
const BROWSER_HEADER_KEYS = [
  'cacheControl',
  'contentSecurityPolicy',
  'crossOriginOpenerPolicy',
  'crossOriginResourcePolicy',
  'referrerPolicy',
  'xContentTypeOptions',
  'xFrameOptions',
] as const;
const MAX_SNAPSHOT_KEYS = PROMOTED_KEYS.length;
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
const IDENTITY_ERRORS = StartGuiIntrinsic.createWeakSet<object>();
const NativePromisePrototype = Promise.prototype;
const apply = Reflect.apply;
const arrayJoin = Array.prototype.join;
const arrayPrototype = Array.prototype;
const defineProperty = Object.defineProperty;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const isFrozen = Object.isFrozen;
const isAbsolutePath = Fs.Path.Is.absolute;
const objectPrototype = Object.prototype;
const ownKeys = Reflect.ownKeys;

/** Snapshot one complete source descriptor without invoking caller-owned accessors or proxy traps. */
export function snapshotEvidence(input: unknown): EvidenceSnapshot {
  const source = snapshotObject(input);
  if (!source) return EMPTY_EVIDENCE;

  const rawKind = ownData(source, 'kind');
  const kind = rawKind.ok && (rawKind.value === 'release' || rawKind.value === 'development')
    ? rawKind.value
    : undefined;
  const manifestUrl = ownData(source, 'manifestUrl');
  const dir = ownData(source, 'dir');
  const integrity = ownData(source, 'integrity');
  const rawExpectedPkg = ownData(source, 'expectedPkg');
  const expectedPkg = rawExpectedPkg.ok
    ? snapshotExpectedPkgValue(rawExpectedPkg.value)
    : undefined;
  const locationReadable = kind === 'release' ? manifestUrl.ok : kind === 'development' && dir.ok;
  const authorityReadable = locationReadable && integrity.ok;
  const retainedManifestUrl = manifestUrl.ok &&
      isBoundedIdentity(manifestUrl.value, AUTHORITY_LIMITS.manifestUrl)
    ? manifestUrl.value
    : undefined;
  const retainedDir = dir.ok && isBoundedIdentity(dir.value, AUTHORITY_LIMITS.developmentDir)
    ? dir.value
    : undefined;
  const retainedIntegrity = integrity.ok &&
      isBoundedIdentity(integrity.value, AUTHORITY_LIMITS.integrity)
    ? integrity.value
    : undefined;
  const sourceKeys = kind === 'release'
    ? RELEASE_SOURCE_KEYS
    : kind === 'development'
    ? DEVELOPMENT_SOURCE_KEYS
    : [];
  const exact = authorityReadable && rawExpectedPkg.ok && sourceKeys.length > 0 &&
    hasExactDataShape(source, sourceKeys) && expectedPkg !== undefined;

  return freeze({
    kind,
    authorityReadable,
    exact,
    manifestUrl: retainedManifestUrl,
    dir: retainedDir,
    integrity: retainedIntegrity,
    expectedPkg,
  });
}

/** Return the already-copied expected identity or emit the stable refusal. */
export function snapshotExpectedPkg(
  input: EvidenceSnapshot,
  diagnostics?: IdentityDiagnostics,
): Readonly<t.Pkg> {
  if (!input.exact || !input.expectedPkg) refuseIdentity(diagnostics);
  return input.expectedPkg;
}

/**
 * Admit one complete materializer settlement before package identity can refuse it.
 * Raw descriptors are observed synchronously and are never dereferenced after this function.
 */
export function admitMaterialization(input: {
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
    observedPkg: snapshotVerifiedPkg(verificationValue.value, input.diagnostics.integrity),
  });
}

/** Admit package identity only after the safe settlement evidence has been retained. */
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

/**
 * Atomically admit one started application owner against the requested pin, package, lifecycle,
 * origin, and applied browser policy without invoking caller-controlled accessors.
 * A captured close method transfers rollback authority even when remaining evidence is invalid.
 */
export function snapshotApplicationOwner(
  input: unknown,
  expected: ApplicationIdentityExpectation,
): ApplicationOwnerSnapshot {
  if (!isDirectObject(input)) return INVALID_APPLICATION_OWNER;
  const closeProperty = ownDirectData(input, 'close');
  if (
    !closeProperty.ok || !Is.func(closeProperty.value) || Is.proxy(closeProperty.value)
  ) return INVALID_APPLICATION_OWNER;

  const closeMethod = closeProperty.value;
  const finishedProperty = ownDirectData(input, 'finished');
  const finished = finishedProperty.ok && isExactNativePromise(finishedProperty.value)
    ? finishedProperty.value
    : undefined;
  const owner: ApplicationOwner = freeze({
    close(reason?: unknown) {
      // Public close is a function property with no receiver contract; retain only that authority.
      return apply(closeMethod, undefined, [reason]) as Promise<void>;
    },
  });

  const invalid = (): ApplicationOwnerSnapshot =>
    freeze({ kind: 'invalid', owner, ...(finished ? { finished } : {}) });
  const originProperty = ownDirectData(input, 'origin');
  const hostnameProperty = ownDirectData(input, 'hostname');
  const portProperty = ownDirectData(input, 'port');
  const addrProperty = ownDirectData(input, 'addr');
  const addr = addrProperty.ok ? snapshotListenerAddress(addrProperty.value) : undefined;
  const addrTransport = addr ? ownData(addr, 'transport') : NOT_DATA;
  const addrHostname = addr ? ownData(addr, 'hostname') : NOT_DATA;
  const addrPort = addr ? ownData(addr, 'port') : NOT_DATA;
  const authorityProperty = ownDirectData(input, 'authority');
  const verificationProperty = ownDirectData(input, 'verification');
  const policyProperty = ownDirectData(input, 'browserPolicy');
  const policy = policyProperty.ok ? snapshotObject(policyProperty.value) : undefined;
  if (
    !originProperty.ok || !hostnameProperty.ok || hostnameProperty.value !== '127.0.0.1' ||
    !portProperty.ok || !isConcreteListenerPort(portProperty.value) ||
    !addr || !hasExactDataShape(addr, LISTENER_ADDRESS_KEYS) ||
    !addrTransport.ok || addrTransport.value !== 'tcp' ||
    !addrHostname.ok || addrHostname.value !== hostnameProperty.value ||
    !addrPort.ok || addrPort.value !== portProperty.value ||
    !policy || !isFrozenObject(policy.target) || !hasExactDataShape(
      policy,
      APPLIED_BROWSER_POLICY_KEYS,
    )
  ) return invalid();

  const kind = ownData(policy, 'kind');
  const policyOrigin = ownData(policy, 'origin');
  const host = ownData(policy, 'host');
  const dedicatedWorkers = ownData(policy, 'dedicatedWorkers');
  const serviceWorker = ownData(policy, 'serviceWorker');
  const fetchMetadata = ownData(policy, 'fetchMetadata');
  const headers = ownData(policy, 'headers');
  const loopback = policyOrigin.ok ? verifiedLoopbackUrl(policyOrigin.value) : undefined;
  if (
    !finished || !kind.ok || kind.value !== 'verified-loopback' || !policyOrigin.ok || !loopback ||
    loopback.port !== `${portProperty.value}` || originProperty.value !== policyOrigin.value ||
    !host.ok || host.value !== loopback.host ||
    !dedicatedWorkers.ok || !isExactFrozenEmptyArray(dedicatedWorkers.value) ||
    !serviceWorker.ok || !matchesFrozenRecord(
      serviceWorker.value,
      SERVICE_WORKER_KEYS,
      { kind: 'tombstone', path: 'sw.js' },
    ) ||
    !fetchMetadata.ok || !matchesFrozenRecord(
      fetchMetadata.value,
      FETCH_METADATA_KEYS,
      { crossSite: 'deny', missing: 'allow' },
    ) ||
    !headers.ok || !matchesFrozenRecord(
      headers.value,
      BROWSER_HEADER_KEYS,
      expectedBrowserHeaders(loopback.origin),
    )
  ) return invalid();

  const authorityAccepted = authorityProperty.ok && matchesFrozenRecord(
    authorityProperty.value,
    HOST_AUTHORITY_KEYS,
    { kind: 'pinned', integrity: expected.integrity },
  );
  const observedPkg = verificationProperty.ok
    ? snapshotVerifiedPkg(verificationProperty.value, expected.integrity)
    : undefined;
  if (
    !authorityAccepted || !observedPkg || observedPkg.name !== expected.expectedPkg.name ||
    observedPkg.version !== expected.expectedPkg.version
  ) {
    return freeze({ kind: 'refused', owner, finished });
  }

  return freeze({
    kind: 'admitted',
    owner: freeze({ ...owner, origin: loopback.origin }),
    finished,
  });
}

/** Determine whether a failure came from the package-owned identity boundary. */
export function isIdentityError(input: unknown): input is IdentityError {
  return Is.object(input) && StartGuiIntrinsic.weakSetHas(IDENTITY_ERRORS, input);
}

/** Emit the stable identity refusal without exposing caller-controlled evidence. */
export function refuseIdentity(diagnostics?: IdentityDiagnostics): never {
  throw identityError(diagnostics);
}

const EMPTY_EVIDENCE: EvidenceSnapshot = freeze({
  kind: undefined,
  authorityReadable: false,
  exact: false,
  manifestUrl: undefined,
  dir: undefined,
  integrity: undefined,
  expectedPkg: undefined,
});

function admitFailure(input: ObjectSnapshot): t.Dist.Failed | undefined {
  const hasPublication = propertyOf(input, 'publication') !== undefined;
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

  return freeze({
    kind: 'failed',
    stage: stage.value,
    reason: reason.value,
    cleanup: cleanup.value,
    ...(admittedPublication ? { publication: admittedPublication } : {}),
  });
}

function snapshotVerifiedPkg(
  input: unknown,
  integrity: t.StringHash,
): Readonly<t.Pkg> | undefined {
  const verification = snapshotObject(input);
  if (
    !verification || !isFrozenObject(verification.target) ||
    !hasExactDataShape(verification, VERIFICATION_KEYS)
  ) return;
  const verificationIntegrity = ownData(verification, 'integrity');
  const distValue = ownData(verification, 'dist');
  if (!verificationIntegrity.ok || verificationIntegrity.value !== integrity || !distValue.ok) {
    return;
  }

  const dist = snapshotObject(distValue.value);
  if (!dist || !isFrozenObject(dist.target) || !hasExactDataShape(dist, DIST_KEYS)) return;
  const pkgValue = ownData(dist, 'pkg');
  return pkgValue.ok ? snapshotObservedPkg(pkgValue.value) : undefined;
}

function snapshotExpectedPkgValue(input: unknown): Readonly<t.Pkg> | undefined {
  const pkg = snapshotObject(input);
  return pkg && snapshotPkgProperties(pkg);
}

function snapshotObservedPkg(input: unknown): Readonly<t.Pkg> | undefined {
  const pkg = snapshotObject(input);
  if (!pkg) return;
  if (!isFrozenObject(pkg.target)) return;
  return snapshotPkgProperties(pkg);
}

function snapshotPkgProperties(input: ObjectSnapshot): Readonly<t.Pkg> | undefined {
  if (!hasExactDataShape(input, PKG_KEYS)) return;
  const name = ownData(input, 'name');
  const version = ownData(input, 'version');
  if (!name.ok || !version.ok) return;
  if (!isBoundedIdentity(name.value, AUTHORITY_LIMITS.packageName)) return;
  if (!isBoundedIdentity(version.value, AUTHORITY_LIMITS.packageVersion)) return;
  const pkg: Readonly<t.Pkg> = freeze({ name: name.value, version: version.value });
  return pkg;
}

function isBoundedIdentity(input: unknown, max: number): input is string {
  if (!Is.string(input) || input.length === 0 || input.length > max) return false;
  for (let index = 0; index < input.length; index += 1) {
    const code = StartGuiIntrinsic.stringCharCodeAt(input, index);
    if (code <= 0x1f || code === 0x7f) return false;
  }
  return true;
}

/** Snapshot one direct object without evaluating any owned accessors. */
function snapshotObject(input: unknown): ObjectSnapshot | undefined {
  return isDirectObject(input) ? snapshotProperties(input) : undefined;
}

/** Admit either a plain record or Deno's exact null-prototype NetAddr data record. */
function snapshotListenerAddress(input: unknown): ObjectSnapshot | undefined {
  if (!Is.object(input) || Is.proxy(input)) return;
  try {
    const prototype = getPrototypeOf(input);
    if (prototype !== objectPrototype && prototype !== null) return;
  } catch {
    return;
  }
  return snapshotProperties(input);
}

function snapshotProperties(input: object): ObjectSnapshot | undefined {
  try {
    const keys = ownKeys(input);
    if (keys.length > MAX_SNAPSHOT_KEYS) return;
    const properties: PropertySnapshot[] = [];
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const descriptor = getOwnPropertyDescriptor(input, key);
      if (!descriptor) return;
      StartGuiIntrinsic.arrayPush(
        properties,
        freeze({
          key,
          enumerable: descriptor.enumerable ?? false,
          data: 'value' in descriptor,
          value: 'value' in descriptor ? descriptor.value : undefined,
        }),
      );
    }
    return freeze({ target: input, properties: freeze(properties) });
  } catch {
    return;
  }
}

function isDirectObject(input: unknown): input is object {
  if (!Is.object(input)) return false;
  try {
    return !Is.proxy(input) && getPrototypeOf(input) === objectPrototype;
  } catch {
    return false;
  }
}

function ownData(
  input: ObjectSnapshot,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  const property = propertyOf(input, key);
  return property?.enumerable && property.data ? { ok: true, value: property.value } : NOT_DATA;
}

function ownDirectData(
  input: unknown,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  if (!isDirectObject(input)) return NOT_DATA;
  return ownObjectData(input, key);
}

function ownObjectData(
  input: unknown,
  key: PropertyKey,
): Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false }> {
  if (!Is.object(input) || Is.proxy(input)) return NOT_DATA;
  try {
    const descriptor = getOwnPropertyDescriptor(input, key);
    return descriptor?.enumerable === true && 'value' in descriptor
      ? { ok: true, value: descriptor.value }
      : NOT_DATA;
  } catch {
    return NOT_DATA;
  }
}

function propertyOf(input: ObjectSnapshot, key: PropertyKey): PropertySnapshot | undefined {
  for (let index = 0; index < input.properties.length; index += 1) {
    const property = input.properties[index];
    if (property.key === key) return property;
  }
}

function hasExactDataShape(input: ObjectSnapshot, keys: readonly string[]): boolean {
  if (input.properties.length !== keys.length) return false;
  for (let index = 0; index < keys.length; index += 1) {
    const property = propertyOf(input, keys[index]);
    if (property?.enumerable !== true || !property.data) return false;
  }
  return true;
}

function oneOf<T extends string>(input: unknown, values: readonly T[]): input is T {
  if (!Is.string(input)) return false;
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === input) return true;
  }
  return false;
}

function isExactNativePromise(input: unknown): input is Promise<void> {
  try {
    return Is.object(input) && !Is.proxy(input) && Is.nativePromise(input) &&
      getPrototypeOf(input) === NativePromisePrototype &&
      getOwnPropertyDescriptor(input, 'constructor') === undefined;
  } catch {
    return false;
  }
}

function isFrozenObject(input: object): boolean {
  try {
    return isFrozen(input);
  } catch {
    return false;
  }
}

function verifiedLoopbackUrl(input: unknown): CapturedUrl | undefined {
  if (!isBoundedIdentity(input, AUTHORITY_LIMITS.manifestUrl)) return;
  const url = captureUrl(input);
  if (
    !url || url.protocol !== 'http:' || url.hostname !== '127.0.0.1' ||
    url.port.length === 0 || url.port === '0' || url.origin !== input || url.pathname !== '/' ||
    url.username || url.password || url.search || url.hash
  ) return;
  return url;
}

function isConcreteListenerPort(input: unknown): input is number {
  return Is.number(input) && input >= 1 && input <= 65_535 && input % 1 === 0;
}

function isExactFrozenEmptyArray(input: unknown): boolean {
  if (!Is.array(input) || Is.proxy(input)) return false;
  try {
    if (getPrototypeOf(input) !== arrayPrototype || !isFrozen(input)) return false;
    const keys = ownKeys(input);
    if (keys.length !== 1 || keys[0] !== 'length') return false;
    const length = getOwnPropertyDescriptor(input, 'length');
    return length !== undefined && 'value' in length && length.value === 0;
  } catch {
    return false;
  }
}

function matchesFrozenRecord(
  input: unknown,
  keys: readonly string[],
  expected: Readonly<Record<string, unknown>>,
): boolean {
  const snapshot = snapshotObject(input);
  if (!snapshot || !isFrozenObject(snapshot.target) || !hasExactDataShape(snapshot, keys)) {
    return false;
  }
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const actual = ownData(snapshot, key);
    if (!actual.ok || actual.value !== expected[key]) return false;
  }
  return true;
}

function expectedBrowserHeaders(origin: t.StringUrl): Readonly<Record<string, unknown>> {
  const worker = `${origin}/sw.js`;
  return freeze({
    cacheControl: 'no-store',
    contentSecurityPolicy: apply(arrayJoin, [
      "default-src 'none'",
      "base-uri 'none'",
      `child-src ${worker}`,
      "connect-src 'self'",
      "font-src 'self'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "frame-src 'none'",
      "img-src 'self' data:",
      "manifest-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      `worker-src ${worker}`,
    ], ['; ']) as string,
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    referrerPolicy: 'no-referrer',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
  });
}

function identityError(diagnostics?: IdentityDiagnostics): IdentityError {
  const error = createOwnedError(
    'start:gui refused GUI Dist package identity.',
  ) as IdentityError;
  if (diagnostics) {
    defineProperty(error, 'identity', {
      configurable: false,
      enumerable: true,
      value: freeze({
        kind: 'refused' as const,
        manifestUrl: diagnostics.manifestUrl,
        integrity: diagnostics.integrity,
      }),
    });
  }
  StartGuiIntrinsic.weakSetAdd(IDENTITY_ERRORS, error);
  return error;
}

const INVALID_APPLICATION_OWNER: ApplicationOwnerSnapshot = freeze({ kind: 'invalid' });
const NOT_DATA = freeze({ ok: false as const });
