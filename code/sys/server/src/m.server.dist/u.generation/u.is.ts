import { Arr, Is, Num, Obj, Pkg, type t, Url } from './common.ts';
import type { InputSnapshot } from './u.input.ts';

const objectPrototype = Object.prototype;
const arrayPrototype = Array.prototype;
const promisePrototype = Promise.prototype;

const FAILURE_STAGES: readonly t.Dist.FailureStage[] = Object.freeze([
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
]);
const FAILURE_REASONS: readonly t.Dist.FailureReason[] = Object.freeze([
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
]);
const CLEANUP: readonly t.Dist.Cleanup[] = Object.freeze([
  'not-needed',
  'complete',
  'pending',
]);

/** Identify callable package authority without admitting callable Proxies. */
export function isDirectCallable(input: unknown): input is (...args: never[]) => unknown {
  try {
    return Is.func(input) && !Is.Native.proxy(input);
  } catch {
    return false;
  }
}

/** Identify one exact undecorated native Promise required by package-internal transports. */
export function isExactPromise(input: unknown): input is Promise<unknown> {
  try {
    return !Is.Native.proxy(input) && Is.Native.promise(input) &&
      Object.getPrototypeOf(input) === promisePrototype && Reflect.ownKeys(input).length === 0;
  } catch {
    return false;
  }
}

export function isVerification(
  input: unknown,
  expected: InputSnapshot,
): input is t.FsPkg.Dist.Verify.Evidence {
  if (!isFrozenData(input, ['integrity', 'dist', 'manifestBytes', 'assets'])) return false;
  const integrity = dataValue(input, 'integrity');
  const manifestBytes = dataValue(input, 'manifestBytes');
  const assets = dataValue(input, 'assets');
  const dist = dataValue(input, 'dist');
  if (
    integrity !== expected.manifest.integrity ||
    !isSafeInt(manifestBytes, 1) ||
    manifestBytes > expected.manifest.policy.verification.manifestBytes ||
    !isFrozenData(assets, ['files', 'totalBytes', 'packageBytes']) ||
    !isDeepFrozenJson(dist, manifestBytes)
  ) {
    return false;
  }

  const files = dataValue(assets, 'files');
  const totalBytes = dataValue(assets, 'totalBytes');
  const packageBytes = dataValue(assets, 'packageBytes');
  if (
    !isSafeInt(files, 1) || files > expected.manifest.policy.verification.entries ||
    !isSafeInt(totalBytes, 0) || totalBytes > expected.manifest.policy.verification.totalBytes ||
    !isSafeInt(packageBytes, 0) || packageBytes > totalBytes ||
    !Pkg.Is.dist(dist)
  ) {
    return false;
  }

  const manifest: t.DistPkg = dist;
  return manifest.build.size.total === totalBytes &&
    manifest.build.size.pkg === packageBytes &&
    Reflect.ownKeys(manifest.hash.parts).length === files;
}

export function isAppliedSeal(input: unknown): input is t.FsRooted.SealApplied {
  return isFrozenData(input, ['kind', 'changed']) &&
    dataValue(input, 'kind') === 'applied' &&
    Is.bool(dataValue(input, 'changed'));
}

export function isSource(
  input: unknown,
  kind: 'existing' | 'promoted',
  expected: InputSnapshot,
): boolean {
  const keys = kind === 'existing'
    ? ['configuredUrl']
    : ['configuredUrl', 'requestedUrl', 'finalUrl'];
  const configuredUrl = expected.manifest.configuredUrl;
  if (!isFrozenData(input, keys) || dataValue(input, 'configuredUrl') !== configuredUrl) {
    return false;
  }
  if (kind === 'existing') return true;

  const requestedUrl = dataValue(input, 'requestedUrl');
  const finalUrl = dataValue(input, 'finalUrl');
  const origins = expected.manifest.policy.manifest.sourceOrigins;
  return requestedUrl === configuredUrl &&
    isAdmittedSourceUrl(requestedUrl, origins) &&
    isAdmittedSourceUrl(finalUrl, origins);
}

export function isTotals(
  input: unknown,
  resources: number,
  expectedBytes: number,
  policy: t.HttpPull.ResourcePolicy,
): input is t.HttpPull.ResourceTotals {
  if (
    !isFrozenData(input, [
      'resources',
      'attempts',
      'transferredBytes',
      'publishedBytes',
    ])
  ) {
    return false;
  }
  const observedResources = dataValue(input, 'resources');
  const attempts = dataValue(input, 'attempts');
  const transferredBytes = dataValue(input, 'transferredBytes');
  const publishedBytes = dataValue(input, 'publishedBytes');
  const maximumAttempts = resources * policy.maxAttempts;
  return Num.Is.safeInt(maximumAttempts) &&
    observedResources === resources && resources <= policy.maxResources &&
    isSafeInt(attempts, resources) && attempts <= maximumAttempts &&
    isSafeInt(transferredBytes, expectedBytes) && transferredBytes <= policy.maxTotalBytes &&
    publishedBytes === expectedBytes;
}

export function isManifestChecksum(input: unknown, expected: t.StringHash): boolean {
  if (!isFrozenData(input, ['expected', 'received'])) return false;
  const reported = dataValue(input, 'expected');
  const received = dataValue(input, 'received');
  return reported === expected && isCanonicalHash(reported) &&
    isCanonicalHash(received) && received !== expected;
}

export function isFrozenData(
  input: unknown,
  keys: readonly PropertyKey[],
  exact = true,
): input is Record<PropertyKey, unknown> {
  if (
    !Is.object(input) || Is.Native.proxy(input) ||
    Object.getPrototypeOf(input) !== objectPrototype || !Object.isFrozen(input)
  ) {
    return false;
  }
  const actual = Reflect.ownKeys(input);
  if (exact && actual.length !== keys.length) return false;
  for (const key of keys) {
    if (!isFrozenEnumerableData(Object.getOwnPropertyDescriptor(input, key))) return false;
  }
  return !exact || actual.every((key) => keys.includes(key));
}

export function dataValue(input: object, key: PropertyKey): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor && Obj.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}

export function isCleanup(input: unknown): input is t.Dist.Cleanup {
  return Is.str(input) && CLEANUP.includes(input as t.Dist.Cleanup);
}

export function isFailureStage(input: unknown): input is t.Dist.FailureStage {
  return Is.str(input) && FAILURE_STAGES.includes(input as t.Dist.FailureStage);
}

export function isFailureReason(input: unknown): input is t.Dist.FailureReason {
  return Is.str(input) && FAILURE_REASONS.includes(input as t.Dist.FailureReason);
}

function isDeepFrozenJson(input: unknown, maxNodes: number): boolean {
  const pending: unknown[] = [input];
  const seen = new Set<object>();
  let scheduled = 1;
  if (scheduled > maxNodes) return false;

  while (pending.length > 0) {
    const value = pending.pop();
    if (value === null || Is.str(value) || Is.bool(value)) continue;
    if (Is.number(value)) {
      if (!Num.Is.finite(value)) return false;
      continue;
    }
    if (!Is.object(value) || Is.Native.proxy(value) || seen.has(value)) return false;
    seen.add(value);

    if (Arr.isArray(value)) {
      const remaining = maxNodes - scheduled;
      if (!isFrozenArray(value, remaining)) return false;
      scheduled += value.length;
      // Positional traversal preserves exact dense-array descriptor admission.
      for (let index = 0; index < value.length; index += 1) {
        pending.push(dataValue(value, String(index)));
      }
      continue;
    }

    if (Object.getPrototypeOf(value) !== objectPrototype || !Object.isFrozen(value)) return false;
    const keys = Reflect.ownKeys(value);
    if (keys.length > maxNodes - scheduled) return false;
    scheduled += keys.length;
    for (const key of keys) {
      if (!Is.str(key)) return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!isFrozenEnumerableData(descriptor)) return false;
      pending.push(descriptor.value);
    }
  }
  return true;
}

export function isFrozenArray(
  input: unknown,
  maxLength: number,
): input is readonly unknown[] {
  if (
    Is.Native.proxy(input) || !Arr.isArray(input) || input.length > maxLength ||
    Object.getPrototypeOf(input) !== arrayPrototype || !Object.isFrozen(input) ||
    Reflect.ownKeys(input).length !== input.length + 1
  ) {
    return false;
  }
  // Positional traversal verifies every exact dense own slot.
  for (let index = 0; index < input.length; index += 1) {
    if (!isFrozenEnumerableData(Object.getOwnPropertyDescriptor(input, String(index)))) {
      return false;
    }
  }
  return true;
}

function isFrozenEnumerableData(
  descriptor: PropertyDescriptor | undefined,
): descriptor is PropertyDescriptor & { readonly value: unknown } {
  return descriptor !== undefined && 'value' in descriptor && descriptor.enumerable === true &&
    descriptor.writable === false && descriptor.configurable === false;
}

function isCanonicalHash(input: unknown): input is t.StringHash {
  if (!Is.str(input)) return false;
  const parsed = Pkg.Dist.Part.parse(input);
  return parsed !== undefined && parsed.hash === input && parsed.size === undefined;
}

function isAdmittedSourceUrl(
  input: unknown,
  origins: readonly t.StringUrl[],
): input is t.StringUrl {
  if (!Is.str(input) || input.length === 0) return false;
  const canonical = Url.toCanonical(input);
  return canonical.ok && canonical.href === input && origins.includes(canonical.toURL().origin);
}

function isSafeInt(input: unknown, minimum: number): input is number {
  return Num.Is.safeInt(input) && input >= minimum;
}
