import { Arr, Fetch, Is, Num, Obj, Pkg, type t, Url } from './common.ts';

export type InputSnapshot = {
  readonly manifestUrl: t.StringUrl;
  readonly configuredUrl: t.StringUrl;
  readonly pin: t.DistPin;
  readonly storeDir: t.StringDir;
  readonly policy: t.Dist.Policy;
  readonly credentials?: t.Dist.Credentials;
  readonly until?: t.UntilInput;
};

export type InputPreparation =
  | { readonly ok: true; readonly value: InputSnapshot }
  | {
    readonly ok: false;
    readonly reason: Extract<t.Dist.FailureReason, 'invalid-input' | 'invalid-policy'>;
  };

const INPUT_KEYS = [
  'manifestUrl',
  'pin',
  'storeDir',
  'policy',
  'credentials',
  'until',
] as const;
const POLICY_KEYS = ['manifest', 'resources', 'verification'] as const;
const RESPONSE_KEYS = [
  'maxBytes',
  'timeout',
  'maxRedirects',
  'progressInterval',
  'sourceOrigins',
  'credentialOrigins',
] as const;
const RESOURCE_POLICY_KEYS = [
  'response',
  'maxResources',
  'concurrency',
  'maxAttempts',
  'retryDelay',
  'maxRetryElapsed',
  'maxTotalBytes',
  'totalTimeout',
] as const;
const VERIFICATION_REQUIRED = ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'] as const;
const VERIFICATION_KEYS = [...VERIFICATION_REQUIRED, 'pathLength', 'pathTotal'] as const;
const CREDENTIALS_KEYS = ['manifest', 'resources'] as const;
const CREDENTIAL_KEYS = ['accessToken', 'headers'] as const;
// Match canonical Pull's safe-integer accounting headroom before any manifest work begins.
const MAX_TRANSFER_CHUNK_BYTES = 4_294_967_295;

export type PreparedManifestCredentials =
  | { readonly ok: true; readonly value?: t.Dist.ManifestCredentials }
  | { readonly ok: false };

/** Snapshot all caller-owned authority before the first asynchronous boundary. */
export function snapshotInput(input: unknown): InputPreparation {
  try {
    if (!exactRecord(input, INPUT_KEYS)) return rejectedInput('invalid-input');
    if (!required(input, ['manifestUrl', 'pin', 'storeDir', 'policy'])) {
      return rejectedInput('invalid-input');
    }

    const manifestUrl = snapshotManifestUrl(input.manifestUrl);
    const pin = snapshotPin(input.pin);
    const storeDir = snapshotStoreDir(input.storeDir);
    const credentials = snapshotCredentials(
      Obj.hasOwn(input, 'credentials') ? input.credentials : undefined,
    );
    const until = Obj.hasOwn(input, 'until') ? input.until : undefined;
    if (!manifestUrl || !pin || !storeDir || credentials === false) {
      return rejectedInput('invalid-input');
    }
    // Own policy before borrowed lifecycle getters can mutate caller authority.
    const policy = snapshotPolicy(input.policy);
    if (!Is.untilInput(until)) return rejectedInput('invalid-input');
    if (!policy) return rejectedInput('invalid-policy');
    const configured = Url.toCanonical(manifestUrl);
    if (!configured.ok) return rejectedInput('invalid-input');

    return {
      ok: true,
      value: Object.freeze({
        manifestUrl,
        configuredUrl: configured.href,
        pin,
        storeDir,
        policy,
        ...(credentials ? { credentials } : {}),
        ...(until === undefined ? {} : { until }),
      }),
    };
  } catch {
    return rejectedInput('invalid-input');
  }
}

/** Evaluate manifest credential callbacks once when, and only when, network work is required. */
export function prepareManifestCredentials(
  input: t.Dist.ManifestCredentials | undefined,
): PreparedManifestCredentials {
  if (!input) return { ok: true };
  try {
    const headers = Fetch.defaultHeaders(input);
    const entries: Array<readonly [string, string]> = [];
    headers.forEach((value, name) => entries.push(Object.freeze([name, value])));
    if (entries.length === 0) return { ok: true };
    const frozen = Object.freeze(entries);
    return {
      ok: true,
      value: Object.freeze({
        headers: ({ set }) => frozen.forEach(([name, value]) => set(name, value)),
      }),
    };
  } catch {
    return { ok: false };
  }
}

function snapshotManifestUrl(input: unknown): t.StringUrl | undefined {
  if (!Is.str(input) || input !== input.trim()) return;
  try {
    const url = new URL(input);
    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      url.username ||
      url.password
    ) {
      return;
    }
    url.hash = '';
    return url.href;
  } catch {
    return;
  }
}

function snapshotPin(input: unknown): t.DistPin | undefined {
  if (Is.Native.proxy(input) || !Pkg.Is.distPin(input)) return;
  return Object.freeze({ scheme: input.scheme, digest: input.digest });
}

function snapshotStoreDir(input: unknown): t.StringDir | undefined {
  return Is.str(input) && input.length > 0 && !input.includes('\0') ? input : undefined;
}

function snapshotPolicy(input: unknown): t.Dist.Policy | undefined {
  if (!exactRecord(input, POLICY_KEYS) || !required(input, POLICY_KEYS)) return;
  const manifest = snapshotResponsePolicy(input.manifest);
  const resources = snapshotResourcePolicy(input.resources);
  const verification = snapshotVerification(input.verification);
  if (!manifest || !resources || !verification) return;
  return Object.freeze({
    manifest: Object.freeze({
      ...manifest,
      maxBytes: Math.min(manifest.maxBytes, verification.manifestBytes),
    }),
    resources,
    verification,
  });
}

function snapshotResponsePolicy(input: unknown): t.HttpFetch.ResponsePolicy | undefined {
  if (!exactRecord(input, RESPONSE_KEYS) || !required(input, RESPONSE_KEYS)) return;
  const maxBytes = input.maxBytes;
  const timeout = input.timeout;
  const maxRedirects = input.maxRedirects;
  const progressInterval = input.progressInterval;
  const sourceOrigins = snapshotOrigins(input.sourceOrigins, false);
  const credentialOrigins = snapshotOrigins(input.credentialOrigins, true);
  if (!isSafeInt(maxBytes, 0)) return;
  if (!isSafeInt(timeout, 1)) return;
  if (!isSafeInt(maxRedirects, 0)) return;
  if (!isSafeInt(progressInterval, 1)) return;
  if (!sourceOrigins || !credentialOrigins || sourceOrigins.length === 0) return;
  const admitted = new Set(sourceOrigins);
  if (credentialOrigins.some((origin) => !admitted.has(origin))) return;
  return Object.freeze({
    maxBytes: maxBytes as t.NumberBytes,
    timeout: timeout as t.Msecs,
    maxRedirects,
    progressInterval: progressInterval as t.Msecs,
    sourceOrigins,
    credentialOrigins,
  });
}

function snapshotOrigins(
  input: unknown,
  allowEmpty: boolean,
): readonly t.StringUrl[] | undefined {
  if (Is.Native.proxy(input) || !Arr.isArray(input)) return;
  if (Object.getPrototypeOf(input) !== Array.prototype) return;
  if ((!allowEmpty && input.length === 0) || Reflect.ownKeys(input).length !== input.length + 1) {
    return;
  }
  const output: t.StringUrl[] = [];
  const seen = new Set<string>();
  // Positional own-data admission must not execute an iterator, getter or inherited slot.
  for (let index = 0; index < input.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
    if (!descriptor || !descriptor.enumerable || !Obj.hasOwn(descriptor, 'value')) return;
    const value: unknown = descriptor.value;
    if (!Is.str(value) || value !== value.trim()) return;
    try {
      const url = new URL(value);
      if (
        (url.protocol !== 'http:' && url.protocol !== 'https:') ||
        url.username ||
        url.password ||
        value !== url.origin ||
        seen.has(url.origin)
      ) {
        return;
      }
      seen.add(url.origin);
      output.push(url.origin);
    } catch {
      return;
    }
  }
  return Object.freeze(output);
}

function snapshotResourcePolicy(input: unknown): t.HttpPull.ResourcePolicy | undefined {
  if (!exactRecord(input, RESOURCE_POLICY_KEYS) || !required(input, RESOURCE_POLICY_KEYS)) return;
  const response = snapshotResponsePolicy(input.response);
  const maxResources = input.maxResources;
  const concurrency = input.concurrency;
  const maxAttempts = input.maxAttempts;
  const retryDelay = input.retryDelay;
  const maxRetryElapsed = input.maxRetryElapsed;
  const maxTotalBytes = input.maxTotalBytes;
  const totalTimeout = input.totalTimeout;
  if (!response) return;
  if (!isSafeInt(maxResources, 0)) return;
  if (!isSafeInt(concurrency, 1)) return;
  if (!isSafeInt(maxAttempts, 1)) return;
  if (!isSafeInt(retryDelay, 0)) return;
  if (!isSafeInt(maxRetryElapsed, 0)) return;
  if (!isSafeInt(maxTotalBytes, 0)) return;
  if (!isSafeInt(totalTimeout, 1)) return;
  if (maxResources > 0 && maxAttempts > Math.floor(Num.MAX_INT / maxResources)) return;
  const maxInFlight = Math.min(maxResources, concurrency);
  const chunkHeadroom = Math.floor(
    (Num.MAX_INT - maxTotalBytes) / MAX_TRANSFER_CHUNK_BYTES,
  );
  if (maxInFlight > chunkHeadroom) return;
  return Object.freeze({
    response,
    maxResources,
    concurrency,
    maxAttempts,
    retryDelay: retryDelay as t.Msecs,
    maxRetryElapsed: maxRetryElapsed as t.Msecs,
    maxTotalBytes: maxTotalBytes as t.NumberBytes,
    totalTimeout: totalTimeout as t.Msecs,
  });
}

function snapshotVerification(input: unknown): t.FsPkg.Dist.Pinned.Verify.Limits | undefined {
  if (!exactRecord(input, VERIFICATION_KEYS) || !required(input, VERIFICATION_REQUIRED)) return;
  const manifestBytes = input.manifestBytes;
  const entries = input.entries;
  const fileBytes = input.fileBytes;
  const totalBytes = input.totalBytes;
  if (!isSafeInt(manifestBytes, 1)) return;
  if (!isSafeInt(entries, 1)) return;
  if (!isSafeInt(fileBytes, 0)) return;
  if (!isSafeInt(totalBytes, 0)) return;
  const { pathLength, pathTotal } = input;
  if (pathLength !== undefined && !isSafeInt(pathLength, 1)) return;
  if (pathTotal !== undefined && !isSafeInt(pathTotal, 1)) return;
  return Object.freeze({
    ...(pathLength === undefined ? {} : { pathLength }),
    ...(pathTotal === undefined ? {} : { pathTotal }),
    manifestBytes: manifestBytes as t.NumberBytes,
    entries: entries as t.NumberTotal,
    fileBytes: fileBytes as t.NumberBytes,
    totalBytes: totalBytes as t.NumberBytes,
  });
}

function snapshotCredentials(input: unknown): t.Dist.Credentials | undefined | false {
  if (input === undefined) return;
  if (!exactRecord(input, CREDENTIALS_KEYS)) return false;
  const manifest = snapshotCredential(
    Obj.hasOwn(input, 'manifest') ? input.manifest : undefined,
  );
  const resources = snapshotCredential(
    Obj.hasOwn(input, 'resources') ? input.resources : undefined,
  );
  if (manifest === false || resources === false) return false;
  return Object.freeze({
    ...(manifest ? { manifest } : {}),
    ...(resources ? { resources } : {}),
  });
}

function snapshotCredential(
  input: unknown,
): t.Dist.ManifestCredentials | undefined | false {
  if (input === undefined) return;
  if (!exactRecord(input, CREDENTIAL_KEYS)) return false;
  const accessToken = Obj.hasOwn(input, 'accessToken') ? input.accessToken : undefined;
  const headers = Obj.hasOwn(input, 'headers') ? input.headers : undefined;
  if (accessToken !== undefined && !Is.str(accessToken) && !Is.func(accessToken)) return false;
  if (headers !== undefined && !Is.func(headers)) return false;
  return Object.freeze({
    ...(accessToken === undefined
      ? {}
      : { accessToken: accessToken as t.HttpFetch.CreateOptions['accessToken'] }),
    ...(headers === undefined ? {} : { headers: headers as t.HttpFetch.Mutate.Headers }),
  });
}

function exactRecord<K extends string>(
  input: unknown,
  keys: readonly K[],
): input is Record<K, unknown> {
  if (!Is.object(input) || Is.Native.proxy(input)) return false;
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Reflect.ownKeys(input).every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    return Is.str(key) && keys.includes(key as K) && descriptor !== undefined &&
      Obj.hasOwn(descriptor, 'value');
  });
}

function required<K extends string>(input: Record<K, unknown>, keys: readonly K[]): boolean {
  return keys.every((key) => Obj.hasOwn(input, key));
}

function isSafeInt(input: unknown, minimum: number): input is number {
  return Num.Is.safeInt(input) && input >= minimum;
}

function rejectedInput(
  reason: Extract<t.Dist.FailureReason, 'invalid-input' | 'invalid-policy'>,
): Extract<InputPreparation, { readonly ok: false }> {
  return Object.freeze({ ok: false, reason });
}
