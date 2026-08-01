import { DEFAULTS, Err, Is, Rx, type t, toHeaders, Url } from './common.ts';

type RequestInput = RequestInfo | URL;
type F = t.HttpFetch.Lib['make'];

/**
 * Factory method:
 */
export const makeFetch: F = (input: Parameters<F>[0]) => {
  const createOptions = wrangle.options(input);
  const life = Rx.abortable(createOptions.until);

  const invokeFetch = async <T>(
    contentType: t.StringContentType,
    input: RequestInput,
    init: RequestInit,
    options: t.HttpFetch.Options,
    toData: (res: Response) => Promise<T>,
    toChecksumInput?: (data: T) => Promise<unknown>,
  ): Promise<t.FetchResponse<T>> => {
    const url = wrangle.href(input);
    const safeUrl = wrangle.safeHref(url);
    const errors = Err.errors();

    let status = 200;
    let statusText = 'OK';
    let data: T | undefined;
    let headers = new Headers();
    let checksum: t.FetchResponseChecksum | undefined;
    let responseReceived = false;
    let requestSignal: AbortSignal | undefined;
    let disposeSignal = () => {};

    try {
      const mergedHeaders = wrangle.headers(createOptions);
      const callerHeaders = new Headers(init.headers);
      callerHeaders.forEach((value, name) => mergedHeaders.set(name, value));

      const method = (init.method ?? 'GET').toUpperCase();
      const hasBody = !Is.nil(init.body);
      const policy = createOptions.contentTypePolicy ?? 'corsSafe';
      const shouldSetContentType = policy === 'always'
        ? true
        : method !== 'GET' && method !== 'HEAD' && hasBody;
      if (contentType && shouldSetContentType && !mergedHeaders.has('content-type')) {
        mergedHeaders.set('content-type', contentType);
      }

      const request = wrangle.signal(life.signal, init.signal ?? undefined);
      requestSignal = request.signal;
      disposeSignal = request.dispose;
      const fetched = await fetch(url, {
        ...init,
        signal: requestSignal,
        headers: mergedHeaders,
      });
      requestSignal?.throwIfAborted();
      responseReceived = true;
      status = fetched.status;
      statusText = fetched.statusText;
      headers = fetched.headers;

      if (fetched.ok) {
        data = await toData(fetched);
        requestSignal?.throwIfAborted();
        if (options.checksum) {
          const { verifyChecksum } = await import('./u.checksum.ts'); // ← NB: Do not load crypto-algos into memory unless needed.
          requestSignal?.throwIfAborted();
          const checksumInput = toChecksumInput ? await toChecksumInput(data) : data;
          requestSignal?.throwIfAborted();
          checksum = verifyChecksum(checksumInput, options.checksum, errors);
          if (!checksum.valid) {
            data = undefined;
            const err = DEFAULTS.error.checksumFail;
            status = err.status;
            statusText = err.statusText;
          }
        }
      } else {
        await fetched.body?.cancel().catch(() => undefined);
        requestSignal?.throwIfAborted();
        const message = `${status} ${statusText || 'HTTP Error'}`;
        errors.push(Err.std(message, { name: 'HttpError' }));
      }
    } catch {
      const name = 'HttpError';
      statusText = 'HTTP Client Error';
      if (requestSignal?.aborted) {
        // HTTP: Request Cancelled:
        data = undefined;
        checksum = undefined;
        const err = DEFAULTS.error.cancelled;
        status = err.status;
        statusText = err.statusText;
        errors.push(Err.std(statusText, { name }));
      } else {
        // HTTP: Unknown Error:
        status = DEFAULTS.error.unknown.status;
        const stage = responseReceived ? 'decoding response' : 'fetching';
        errors.push(Err.std(`Failed while ${stage}: ${safeUrl}`, { name }));
      }
    } finally {
      disposeSignal();
    }

    // Prepare error:
    let error: t.HttpError | undefined;
    const cause = errors.toError();
    if (cause) {
      const method = (init.method ?? 'GET').toUpperCase();
      const name = 'HttpError';
      const message = `HTTP/${method} request failed: ${safeUrl}`;
      const base = Err.std(message, { name, cause });
      error = { ...base, status, statusText, headers: toHeaders(headers) };
    }

    // Finish up.
    const ok = !cause;
    return {
      ok,
      status,
      statusText,
      url: ok ? url : safeUrl,
      get headers() {
        return headers;
      },
      get data() {
        return data;
      },
      error,
      checksum,
    } as t.FetchResponse<T>;
  };

  const api: t.HttpFetch.Instance = Rx.toLifecycle<t.HttpFetch.Instance>(life, {
    header: (name) => wrangle.headers(createOptions).get(name) ?? undefined,
    get headers() {
      return toHeaders(wrangle.headers(createOptions));
    },

    head(input: RequestInput, init: RequestInit = {}, options = {}) {
      const req = { ...init, method: 'HEAD' };
      const toData = async () => undefined as undefined; // ← No body.
      return invokeFetch<undefined>('', input, req, options, toData); // '' = no header
    },

    json<T>(input: RequestInput, init: RequestInit = {}, options = {}) {
      return invokeFetch<T>('application/json', input, init, options, (r) => r.json());
    },

    text(input: RequestInput, init: RequestInit = {}, options = {}) {
      return invokeFetch<string>('text/plain', input, init, options, (r) => r.text());
    },

    blob(input: RequestInput, init: RequestInit = {}, options = {}) {
      return invokeFetch<Blob>(
        'application/octet-stream',
        input,
        init,
        options,
        (response) => response.blob(),
        (data) => data.arrayBuffer(),
      );
    },
  });

  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  options(input: Parameters<F>[0]): t.HttpFetch.CreateOptions {
    if (Is.falsy(input)) return {};
    if (Is.untilInput(input)) return { until: input };
    if (Is.object(input)) return input as t.HttpFetch.CreateOptions;
    return {};
  },

  href(input: RequestInput): string {
    if (Is.str(input)) return input;
    if (input instanceof Request) return input.url;
    if (input instanceof URL) return input.href;
    throw new Error('Unsupported input type');
  },

  safeHref(input: string): string {
    const canonical = Url.toCanonical(input);
    return canonical.ok ? canonical.href : '';
  },

  accessToken(options: t.HttpFetch.CreateOptions): string {
    const accessToken = options.accessToken;
    if (Is.func(accessToken)) return accessToken();
    if (Is.str(accessToken)) {
      const token = accessToken
        .trim()
        .replace(/^Bearer /, '')
        .trim();
      return `Bearer ${token}`;
    }
    return '';
  },

  headers(options: t.HttpFetch.CreateOptions): Headers {
    const headers = new Headers();
    const accessToken = wrangle.accessToken(options);
    if (accessToken) headers.set('authorization', accessToken);

    if (Is.func(options.headers)) {
      const payload: t.HttpMutateHeadersArgs = {
        get headers() {
          return toHeaders(headers);
        },
        get(name) {
          return headers.get(name) ?? (undefined as unknown as t.StringHttpHeader);
        },
        set(name, value) {
          const next = Is.str(value) ? value.trim() : value;
          if (Is.falsy(next)) headers.delete(name);
          else headers.set(name, String(next));
          return payload;
        },
      };
      options.headers(payload);
    }

    return headers;
  },

  signal(...signals: Array<AbortSignal | undefined>) {
    const active = signals.filter(Is.abortSignal);
    if (active.length <= 1) return { signal: active[0], dispose: () => {} };

    const controller = new AbortController();
    const abort = (signal: AbortSignal) => {
      if (!controller.signal.aborted) controller.abort(signal.reason);
    };
    const listeners = active.map((signal) => {
      const onAbort = () => abort(signal);
      signal.addEventListener('abort', onAbort, { once: true });
      return { signal, onAbort };
    });

    for (const signal of active) {
      if (signal.aborted) {
        abort(signal);
        break;
      }
    }

    const dispose = () => {
      listeners.forEach(({ signal, onAbort }) => signal.removeEventListener('abort', onAbort));
    };
    return { signal: controller.signal, dispose };
  },
} as const;
