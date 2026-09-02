import { Is, type t } from '../common.ts';

import { AUTHORITY_LIMITS } from '../u.limits.ts';
import { type CapturedUrl, captureUrl } from '../u.url.ts';
import type {
  ApplicationIdentityExpectation,
  ApplicationOwner,
  ApplicationOwnerSnapshot,
} from './t.ts';
import {
  hasExactDataShape,
  isDirectObject,
  isFrozenObject,
  ownData,
  ownDirectData,
  snapshotListenerAddress,
  snapshotObject,
} from './u.snapshot.ts';
import { isBoundedIdentity, snapshotVerifiedDist } from './u.source.ts';

const KEYS = {
  LISTENER_ADDRESS: ['transport', 'hostname', 'port'],
  HOST_AUTHORITY: ['kind', 'integrity'],
  APPLIED_BROWSER_POLICY: [
    'kind',
    'origin',
    'host',
    'dedicatedWorkers',
    'serviceWorker',
    'fetchMetadata',
    'headers',
  ],
  SERVICE_WORKER: ['kind', 'path'],
  FETCH_METADATA: ['crossSite', 'missing'],
  BROWSER_HEADERS: [
    'cacheControl',
    'contentSecurityPolicy',
    'crossOriginOpenerPolicy',
    'crossOriginResourcePolicy',
    'referrerPolicy',
    'xContentTypeOptions',
    'xFrameOptions',
  ],
} as const;

const NativePromisePrototype = Promise.prototype;
const apply = Reflect.apply;
const arrayJoin = Array.prototype.join;
const arrayPrototype = Array.prototype;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const ownKeys = Reflect.ownKeys;

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
    !closeProperty.ok || !Is.func(closeProperty.value) || Is.Native.proxy(closeProperty.value)
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
  const addr = addrProperty.ok
    ? snapshotListenerAddress(addrProperty.value, KEYS.LISTENER_ADDRESS.length)
    : undefined;
  const addrTransport = addr ? ownData(addr, 'transport') : undefined;
  const addrHostname = addr ? ownData(addr, 'hostname') : undefined;
  const addrPort = addr ? ownData(addr, 'port') : undefined;
  const authorityProperty = ownDirectData(input, 'authority');
  const verificationProperty = ownDirectData(input, 'verification');
  const policyProperty = ownDirectData(input, 'browserPolicy');
  const policy = policyProperty.ok
    ? snapshotObject(policyProperty.value, KEYS.APPLIED_BROWSER_POLICY.length)
    : undefined;
  if (
    !originProperty.ok || !hostnameProperty.ok || hostnameProperty.value !== '127.0.0.1' ||
    !portProperty.ok || !isConcreteListenerPort(portProperty.value) ||
    !addr || !hasExactDataShape(addr, KEYS.LISTENER_ADDRESS) ||
    !addrTransport?.ok || addrTransport.value !== 'tcp' ||
    !addrHostname?.ok || addrHostname.value !== hostnameProperty.value ||
    !addrPort?.ok || addrPort.value !== portProperty.value ||
    !policy || !isFrozenObject(policy.target) || !hasExactDataShape(
      policy,
      KEYS.APPLIED_BROWSER_POLICY,
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
      KEYS.SERVICE_WORKER,
      { kind: 'tombstone', path: 'sw.js' },
    ) ||
    !fetchMetadata.ok || !matchesFrozenRecord(
      fetchMetadata.value,
      KEYS.FETCH_METADATA,
      { crossSite: 'deny', missing: 'allow' },
    ) ||
    !headers.ok || !matchesFrozenRecord(
      headers.value,
      KEYS.BROWSER_HEADERS,
      expectedBrowserHeaders(loopback.origin),
    )
  ) return invalid();

  const authorityAccepted = authorityProperty.ok && matchesFrozenRecord(
    authorityProperty.value,
    KEYS.HOST_AUTHORITY,
    { kind: 'pinned', integrity: expected.integrity },
  );
  const observedDist = verificationProperty.ok
    ? snapshotVerifiedDist(verificationProperty.value, expected.integrity)
    : undefined;
  if (
    !authorityAccepted || !observedDist?.pkg ||
    observedDist.pkg.name !== expected.expectedPkg.name ||
    observedDist.pkg.version !== expected.expectedPkg.version
  ) {
    return freeze({ kind: 'refused', owner, finished });
  }

  return freeze({
    kind: 'admitted',
    owner: freeze({ ...owner, origin: loopback.origin, digest: observedDist.digest }),
    finished,
  });
}

function isExactNativePromise(input: unknown): input is Promise<void> {
  try {
    return Is.object(input) && !Is.Native.proxy(input) && Is.Native.promise(input) &&
      getPrototypeOf(input) === NativePromisePrototype &&
      getOwnPropertyDescriptor(input, 'constructor') === undefined;
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
  if (!Is.array(input) || Is.Native.proxy(input)) return false;
  try {
    if (getPrototypeOf(input) !== arrayPrototype || !isFrozenObject(input)) return false;
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
  const snapshot = snapshotObject(input, keys.length);
  if (!snapshot || !isFrozenObject(snapshot.target) || !hasExactDataShape(snapshot, keys)) {
    return false;
  }
  // Indexed traversal avoids ambient array-iterator authority.
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

const INVALID_APPLICATION_OWNER: ApplicationOwnerSnapshot = freeze({ kind: 'invalid' });
