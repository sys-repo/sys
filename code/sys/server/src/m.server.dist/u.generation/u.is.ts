import { Hash } from '@sys/crypto/hash';
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
  'pin-mismatch',
  'checksum-mismatch',
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
  onInventory?: () => void,
): input is t.FsPkg.Dist.Verify.Evidence {
  if (!isFrozenData(input, ['content', 'manifestChecksum', 'manifestBytes', 'assets'])) {
    return false;
  }
  const manifestBytes = dataValue(input, 'manifestBytes');
  const assets = dataValue(input, 'assets');
  const content = dataValue(input, 'content');
  if (
    !isCanonicalHash(dataValue(input, 'manifestChecksum')) ||
    !isSafeInt(manifestBytes, 1) ||
    manifestBytes > expected.manifest.policy.verification.manifestBytes ||
    !isFrozenData(assets, ['files', 'totalBytes', 'packageBytes']) ||
    !isFrozenData(content, ['scheme', 'digest', 'parts']) ||
    dataValue(content, 'scheme') !== expected.manifest.pin.scheme ||
    dataValue(content, 'digest') !== expected.manifest.pin.digest
  ) {
    return false;
  }

  const files = dataValue(assets, 'files');
  const totalBytes = dataValue(assets, 'totalBytes');
  const packageBytes = dataValue(assets, 'packageBytes');
  if (
    !isSafeInt(files, 1) || files >= expected.manifest.policy.verification.entries ||
    !isSafeInt(totalBytes, 0) || totalBytes > expected.manifest.policy.verification.totalBytes ||
    !isSafeInt(packageBytes, 0) || packageBytes > totalBytes
  ) {
    return false;
  }

  // Scalar refusals precede every inspection/expansion of the potentially large parts dictionary.
  // This internal observation seam proves ordering without global reflection patches or timing tests.
  onInventory?.();
  const parts = dataValue(content, 'parts');
  if (
    !Is.object(parts) || Is.Native.proxy(parts) ||
    Object.getPrototypeOf(parts) !== objectPrototype || !Object.isFrozen(parts)
  ) return false;
  try {
    const limits = expected.manifest.policy.verification;
    const ceilings = Pkg.Dist.Content.limits;
    const pathLimit = Num.clamp(0, ceilings.pathLength, limits.pathLength ?? ceilings.pathLength);
    const workLimit = Num.clamp(0, ceilings.pathTotal, limits.pathTotal ?? ceilings.pathTotal);
    const entryLimit = Num.clamp(0, ceilings.entries, limits.entries);
    let structuralEntries = 1; // The manifest is not a payload file.
    const directories = new Set<string>();
    let pathUnits = 0;
    let prefixUnits = 0;
    let count = 0;
    let total = 0;
    let code = 0;
    // Match FS's structural, UTF-16 inventory, and prefix-work budgets before encoding.
    for (const path in parts) {
      if (!Obj.hasOwn(parts, path)) continue;
      if (++count > files || ++structuralEntries > entryLimit || path.length > pathLimit) {
        return false;
      }
      const descriptor = Object.getOwnPropertyDescriptor(parts, path);
      if (!isFrozenEnumerableData(descriptor) || !Is.str(descriptor.value)) return false;
      // Match FS admission's maximum canonical hash/size length before regex parsing.
      if (descriptor.value.length > 93) return false;
      const part = Pkg.Dist.Part.parse(descriptor.value);
      if (!part || part.size === undefined || part.size > limits.fileBytes) return false;
      total += part.size;
      if (Pkg.Dist.Is.codePath(path)) code += part.size;
      if (!Num.Is.safeInt(total) || total > limits.totalBytes) return false;
      pathUnits += path.length;
      if (pathUnits > workLimit) return false;
      // Charge every prefix before allocation; count shared directories only once as entries.
      let separator = path.indexOf('/');
      while (separator >= 0) {
        prefixUnits += separator;
        if (prefixUnits > workLimit) return false;
        const directory = path.slice(0, separator);
        if (!directories.has(directory)) {
          if (++structuralEntries > entryLimit) return false;
          directories.add(directory);
        }
        separator = path.indexOf('/', separator + 1);
      }
    }
    if (count !== files || total !== totalBytes || code !== packageBytes) return false;
    // The encoder selects enumerable string keys. Do not return hidden or symbol authority
    // alongside that inventory; inspect exact own-key membership only after budget accounting.
    if (Reflect.ownKeys(parts).length !== count) return false;
    return Hash.sha256(Pkg.Dist.Content.encode(parts as t.DistContent['parts'])) ===
      expected.manifest.pin.digest;
  } catch {
    return false;
  }
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

export function isExpectedPin(input: unknown, expected: t.DistPin): input is t.DistPin {
  return isFrozenData(input, ['scheme', 'digest']) &&
    dataValue(input, 'scheme') === expected.scheme &&
    dataValue(input, 'digest') === expected.digest;
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
