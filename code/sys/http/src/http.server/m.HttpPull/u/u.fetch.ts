import { Err, HttpClient, Num, type t, Time } from '../common.ts';
import { isAbortError } from './u.abort.ts';

type FetchBytesResult =
  | {
    readonly ok: true;
    readonly bytes: Uint8Array;
    readonly status: t.HttpStatusCode;
    readonly checksum?: t.HttpFetch.ResponseChecksum;
  }
  | {
    readonly ok: false;
    readonly status?: t.HttpStatusCode;
    readonly error: string;
    readonly checksum?: t.HttpFetch.ResponseChecksum;
  };

type NormalizedRetry =
  | { readonly enabled: false }
  | {
    readonly enabled: true;
    readonly attempts: number;
    readonly base: t.Msecs;
    readonly factor: number;
    readonly jitter: boolean;
  };

type FetchBytesOptions = {
  readonly signal?: AbortSignal;
  readonly retry?: t.HttpPull.Options['retry'];
  readonly checksum?: t.StringHash;
};

type FetchBytesOnceOptions = {
  readonly signal?: AbortSignal;
  readonly checksum?: t.StringHash;
};

/** Fetch one binary resource without retry authority. */
export async function fetchBytesOnce(
  url: URL,
  client: t.HttpFetch.Instance,
  options: FetchBytesOnceOptions,
): Promise<FetchBytesResult> {
  let response: t.HttpFetch.Response<Blob>;

  try {
    response = await client.blob(
      url.href,
      { signal: options.signal },
      { checksum: options.checksum },
    );
  } catch (cause) {
    // Preserve the legacy conversion of thrown status-bearing transport failures.
    const message = Err.normalize(cause).message;
    const match = message.match(/(\d{3})/);
    const status = match ? Number(match[1]) : undefined;
    return { ok: false, status, error: message };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: response.error?.message ??
        (response.status ? `HTTP ${response.status}` : 'Network error'),
      checksum: response.checksum,
    };
  }

  return {
    ok: true,
    status: response.status,
    bytes: await HttpClient.toUint8Array(response.data),
    checksum: response.checksum,
  };
}

/** Fetch one binary resource while preserving the legacy retry behavior. */
export async function fetchBytes(
  url: URL,
  client: t.HttpFetch.Instance,
  options: FetchBytesOptions,
): Promise<FetchBytesResult> {
  const retry = normalizeRetry(options.retry);
  const attempt = () => fetchBytesOnce(url, client, options);

  if (!retry.enabled) return await attempt();

  for (let attemptIndex = 0; attemptIndex < retry.attempts; attemptIndex++) {
    try {
      const result = await attempt();
      if (result.ok) return result;

      const retryable = result.status && result.status >= 500 && result.status <= 599;
      const last = attemptIndex === retry.attempts - 1;
      if (!retryable || last) return result;

      await waitForRetry(retry, attemptIndex, options.signal);
    } catch (cause) {
      if (isAbortError(cause)) throw cause;

      const message = Err.normalize(cause).message;
      const retryable = message.includes('5');
      const last = attemptIndex === retry.attempts - 1;
      if (!retryable || last) return { ok: false, error: message };

      await waitForRetry(retry, attemptIndex, options.signal);
    }
  }

  return { ok: false, error: 'Unknown pull error' };
}

function normalizeRetry(retry: t.HttpPull.Options['retry']): NormalizedRetry {
  if (retry === false) return { enabled: false };
  if (retry == null || retry === true) {
    return { enabled: true, attempts: 3, base: 50, factor: 2, jitter: true };
  }
  return {
    enabled: true,
    attempts: retry.attempts ?? 3,
    base: retry.base ?? 50,
    factor: retry.factor ?? 2,
    jitter: retry.jitter ?? true,
  };
}

async function waitForRetry(
  retry: Extract<NormalizedRetry, { readonly enabled: true }>,
  attempt: number,
  signal?: AbortSignal,
): Promise<void> {
  const raw = retry.base * retry.factor ** attempt;
  const delay = retry.jitter ? raw + Math.floor(Num.random(0, raw * 0.3)) : raw;
  await Time.wait(delay as t.Msecs, { signal });
}
