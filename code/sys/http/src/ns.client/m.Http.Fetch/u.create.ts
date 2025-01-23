import { type t, DEFAULTS, Err, Is, rx, toHeaders } from './common.ts';

type RequestInput = RequestInfo | URL;
type F = t.HttpFetchLib['create'];

export const create: F = (input: Parameters<F>[0]) => {
  const options = wrangle.options(input);
  let _aborted = false;

  const life = rx.lifecycle(options.dispose$);
  const controller = new AbortController();
  life.dispose$.subscribe(() => {
    _aborted = true;
    controller.abort();
  });

  const invokeFetch = async <T>(
    contentType: t.StringContentType,
    input: RequestInput,
    init: RequestInit,
    options: t.HttpFetchOptions,
    toData: (res: Response) => Promise<T>,
  ): Promise<t.FetchResponse<T>> => {
    const url = wrangle.href(input);
    const errors = Err.errors();

    let status = 200;
    let statusText = 'OK';
    let data: T | undefined;
    let headers: Headers = new Headers();
    let checksum: undefined | t.FetchResponseChecksum;

    try {
      const fetched = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { ...api.headers, 'content-type': contentType },
      });
      status = fetched.status;
      statusText = fetched.statusText;
      headers = fetched.headers;

      if (fetched.ok) {
        data = await toData(fetched);

        if (options.checksum) {
          // NB: do not load crypto-algos into memory unless needed.
          const { verifyChecksum } = await import('./u.checksum.ts');
          checksum = verifyChecksum<T>(data, options.checksum, errors);
          if (!checksum.valid) {
            const err = DEFAULTS.error.checksumFail;
            status = err.status;
            statusText = err.statusText;
          }
        }
      } else {
        fetched.body?.cancel();
        errors.push(fetched);
      }
    } catch (cause: unknown) {
      const name = 'HttpError';
      statusText = 'HTTP Client Error';
      if (_aborted) {
        // HTTP: Client Closed Request.
        const err = DEFAULTS.error.clientDisposed;
        status = err.status;
        statusText = err.statusText;
        const error = Err.std(statusText, { name });
        errors.push(error);
      } else {
        // HTTP: Unknown Error.
        status = DEFAULTS.error.unknown.status;
        const err = Err.std(`Failed while fetching: ${url}`, { cause, name });
        errors.push(err);
      }
    }

    // Prepare error.
    let error: t.HttpError | undefined;
    const cause = errors.toError();
    if (cause) {
      const method = (init.method ?? 'GET').toUpperCase();
      const name = 'HttpError';
      const message = `HTTP/${method} request failed: ${url}`;
      const headers = toHeaders(init.headers);
      const base = Err.std(message, { name, cause });
      error = { ...base, status, statusText, headers };
    }

    // Finish up.
    const ok = !cause;
    return {
      ok,
      status,
      statusText,
      url,
      get headers() {
        return headers;
      },
      data,
      error,
      checksum,
    } as t.FetchResponse<T>;
  };

  const api: t.HttpFetch = {
    get headers() {
      return wrangle.headers(options);
    },

    header: (name) => (api.headers as any)[name],

    async json<T>(input: RequestInput, init: RequestInit = {}, options = {}) {
      return invokeFetch<T>('application/json', input, init, options, (res) => res.json());
    },

    async text(input: RequestInput, init: RequestInit = {}, options = {}) {
      return invokeFetch<string>('text/plain', input, init, options, (res) => res.text());
    },

    /**
     * Lifecycle.
     */
    dispose: life.dispose,
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };

  return api;
};

/**
 * Helpers
 */
const wrangle = {
  options(input: Parameters<F>[0]): t.HttpFetchCreateOptions {
    if (!input) return {};
    if (Array.isArray(input) || Is.observable(input)) return { dispose$: input };
    if (typeof input === 'object') return input as t.HttpFetchCreateOptions;
    return {};
  },

  href(input: RequestInput): string {
    if (typeof input === 'string') {
      return input;
    } else if (input instanceof Request) {
      return input.url;
    } else if (input instanceof URL) {
      return input.href;
    }
    throw new Error('Unsupported input type');
  },

  accessToken(options: t.HttpFetchCreateOptions): string {
    const accessToken = options.accessToken;
    if (typeof accessToken === 'function') return accessToken();
    if (typeof accessToken === 'string') {
      const token = accessToken
        .trim()
        .replace(/^Bearer /, '')
        .trim();
      return `Bearer ${token}`;
    }
    return '';
  },

  headers(options: t.HttpFetchCreateOptions): t.HttpHeaders {
    const accessToken = wrangle.accessToken(options);
    const headers: any = {};
    if (accessToken) headers['Authorization'] = accessToken;

    if (typeof options.headers === 'function') {
      const payload: t.HttpMutateHeadersArgs = {
        get headers() {
          return { ...headers };
        },
        get(name) {
          return headers[name];
        },
        set(name, value) {
          if (typeof value === 'string') value = value.trim();
          if (!value) delete headers[name];
          else headers[name] = String(value);
          return payload;
        },
      };
      options.headers(payload);
    }

    return headers;
  },
} as const;
