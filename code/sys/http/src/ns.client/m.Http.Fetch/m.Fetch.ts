import { toHeaders } from '../m.Http/u.ts';
import { type t, Err, rx } from './common.ts';

type RequestInput = RequestInfo | URL;

export const Fetch: t.HttpFetchLib = {
  disposable(until$?: t.UntilObservable) {
    let _aborted = false;

    const life = rx.lifecycle(until$);
    const controller = new AbortController();
    life.dispose$.subscribe(() => {
      _aborted = true;
      controller.abort();
    });

    const invokeFetch = async <T>(
      input: RequestInput,
      init: RequestInit,
      options: t.HttpFetchOptions,
      toData: (res: Response) => Promise<T>,
    ): Promise<t.FetchResponse<T>> => {
      const errors = Err.errors();
      const url = wrangle.href(input);
      let status = 200;
      let statusText = 'OK';
      let data: T | undefined;
      let headers: Headers = new Headers();
      let checksum: undefined | t.FetchResponseChecksum;

      try {
        const { signal } = controller;
        const fetched = await fetch(url, { ...init, signal });
        status = fetched.status;
        statusText = fetched.statusText;
        headers = fetched.headers;

        if (fetched.ok) {
          data = await toData(fetched);

          if (options.checksum) {
            const { verifyChecksum } = await import('./u.checksum.ts');
            checksum = verifyChecksum<T>(data, options.checksum, errors);
            if (!checksum.valid) status = 412;
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
          status = 499;
          const err = Err.std('Fetch operation disposed before completing (499)', { name });
          errors.push(err);
        } else {
          // HTTP: Unknown Error.
          status = 520;
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
        url,
        get headers() {
          return headers;
        },
        data,
        error,
        checksum,
      } as t.FetchResponse<T>;
    };

    const api: t.HttpDisposableFetch = {
      async json<T>(input: RequestInput, init: RequestInit = {}, options = {}) {
        return invokeFetch<T>(input, init, options, (res) => res.json());
      },

      async text(input: RequestInput, init: RequestInit = {}, options = {}) {
        return invokeFetch<string>(input, init, options, (res) => res.text());
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
  },
};

/**
 * Helpers
 */
const wrangle = {
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
} as const;
