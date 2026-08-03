import { Arr, Is, Num, Obj, Pkg, type t, Url } from './common.ts';

export type InputSnapshot = Readonly<{
  manifestUrl: t.StringUrl;
  configuredUrl: t.StringUrl;
  integrity: t.StringHash;
  storeDir: t.StringDir;
  policy: t.ServerDist.Policy;
  credentials?: t.ServerDist.Credentials;
  until?: t.UntilInput;
}>;

export type InputPreparation =
  | { readonly ok: true; readonly value: InputSnapshot }
  | {
    readonly ok: false;
    readonly reason: Extract<t.ServerDist.FailureReason, 'invalid-input' | 'invalid-policy'>;
  };

const INPUT_KEYS = [
  'manifestUrl',
  'integrity',
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
const VERIFICATION_KEYS = ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'] as const;
const CREDENTIALS_KEYS = ['manifest', 'resources'] as const;
const CREDENTIAL_KEYS = ['accessToken', 'headers'] as const;
// Match canonical Pull's safe-integer accounting headroom before any manifest work begins.
const MAX_TRANSFER_CHUNK_BYTES = 4_294_967_295;

export type PreparedManifestCredentials =
  | { readonly ok: true; readonly value?: t.ServerDist.ManifestCredentials }
  | { readonly ok: false };

/** Snapshot all caller-owned authority before the first asynchronous boundary. */
export function snapshotInput(input: unknown): InputPreparation {
  try {
    if (!exactRecord(input, INPUT_KEYS)) return rejectedInput('invalid-input');
    if (!required(input, ['manifestUrl', 'integrity', 'storeDir', 'policy'])) {
      return rejectedInput('invalid-input');
    }

    const manifestUrl = snapshotManifestUrl(input.manifestUrl);
    const integrity = snapshotIntegrity(input.integrity);
    const storeDir = snapshotStoreDir(input.storeDir);
    const credentials = snapshotCredentials(
      Obj.hasOwn(input, 'credentials') ? input.credentials : undefined,
    );
    const until = Obj.hasOwn(input, 'until') ? input.until : undefined;
    if (!manifestUrl || !integrity || !storeDir || credentials === false) {
      return rejectedInput('invalid-input');
    }
    if (!Is.untilInput(until)) return rejectedInput('invalid-input');

    const policy = snapshotPolicy(input.policy);
    if (!policy) return rejectedInput('invalid-policy');
    const configured = Url.toCanonical(manifestUrl);
    if (!configured.ok) return rejectedInput('invalid-input');

    return {
      ok: true,
      value: Object.freeze({
        manifestUrl,
        configuredUrl: configured.href,
        integrity,
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
  input: t.ServerDist.ManifestCredentials | undefined,
): PreparedManifestCredentials {
  if (!input) return { ok: true };
  try {
    let accessToken: unknown = input.accessToken;
    if (Is.func(accessToken)) accessToken = accessToken();
    if (Is.promise(accessToken)) {
      drain(accessToken);
      return { ok: false };
    }
    if (accessToken !== undefined && !Is.str(accessToken)) return { ok: false };

    const headers = new Headers();
    if (Is.str(accessToken)) {
      const token = accessToken.trim().replace(/^Bearer /, '').trim();
      if (token) headers.set('authorization', `Bearer ${token}`);
    }

    const mutate = input.headers;
    if (mutate) {
      const payload: t.HttpFetch.Mutate.Headers.Args = {
        get headers() {
          const result: Record<string, string> = {};
          headers.forEach((value, name) => (result[name] = value));
          return result;
        },
        get(name) {
          return headers.get(name) ?? undefined;
        },
        set(name, value) {
          const next = Is.str(value) ? value.trim() : value;
          if (Is.falsy(next)) headers.delete(name);
          else headers.set(name, String(next));
          return payload;
        },
      };
      const output = mutate(payload);
      if (Is.promise(output)) {
        drain(output);
        return { ok: false };
      }
    }

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

function snapshotIntegrity(input: unknown): t.StringHash | undefined {
  const parsed = Pkg.Dist.Part.parse(input);
  return parsed && parsed.hash === input && parsed.size === undefined ? parsed.hash : undefined;
}

function snapshotStoreDir(input: unknown): t.StringDir | undefined {
  return Is.str(input) && input.length > 0 && !input.includes('\0') ? input : undefined;
}

function snapshotPolicy(input: unknown): t.ServerDist.Policy | undefined {
  if (!exactRecord(input, POLICY_KEYS) || !required(input, POLICY_KEYS)) return;
  const manifest = snapshotResponsePolicy(input.manifest);
  const resources = snapshotResourcePolicy(input.resources);
  const verification = snapshotVerification(input.verification);
  if (!manifest || !resources || !verification) return;
  return Object.freeze({ manifest, resources, verification });
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
  if (!Arr.isArray(input) || (!allowEmpty && input.length === 0)) return;
  const output: t.StringUrl[] = [];
  const seen = new Set<string>();
  for (const value of input) {
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

function snapshotVerification(input: unknown): t.FsPkg.Dist.VerifyPinned.Limits | undefined {
  if (!exactRecord(input, VERIFICATION_KEYS) || !required(input, VERIFICATION_KEYS)) return;
  const manifestBytes = input.manifestBytes;
  const entries = input.entries;
  const fileBytes = input.fileBytes;
  const totalBytes = input.totalBytes;
  if (!isSafeInt(manifestBytes, 1)) return;
  if (!isSafeInt(entries, 1)) return;
  if (!isSafeInt(fileBytes, 0)) return;
  if (!isSafeInt(totalBytes, 0)) return;
  return Object.freeze({
    manifestBytes: manifestBytes as t.NumberBytes,
    entries: entries as t.NumberTotal,
    fileBytes: fileBytes as t.NumberBytes,
    totalBytes: totalBytes as t.NumberBytes,
  });
}

function snapshotCredentials(input: unknown): t.ServerDist.Credentials | undefined | false {
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
): t.ServerDist.ManifestCredentials | undefined | false {
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
  return Is.plainObject(input) &&
    Obj.keys(input).every((key) => keys.includes(key as K));
}

function required<K extends string>(input: Record<K, unknown>, keys: readonly K[]): boolean {
  return keys.every((key) => Obj.hasOwn(input, key));
}

function isSafeInt(input: unknown, minimum: number): input is number {
  return Num.Is.safeInt(input) && input >= minimum;
}

function rejectedInput(
  reason: Extract<t.ServerDist.FailureReason, 'invalid-input' | 'invalid-policy'>,
): Extract<InputPreparation, { readonly ok: false }> {
  return Object.freeze({ ok: false, reason });
}

function drain(input: PromiseLike<unknown>): void {
  try {
    Promise.resolve(input).catch(() => undefined);
  } catch {
    // A hostile thenable is already classified as invalid credential input.
  }
}
