import { toHeaders } from '../m.Http/u.ts';
import { type t, Err, rx } from './common.ts';

export const Fetch: t.HttpFetchLib = {
  disposable(until$?: t.UntilObservable) {
    let _aborted = false;
    const life = rx.lifecycle(until$);
    const controller = new AbortController();
    life.dispose$.subscribe(() => {
      _aborted = true;
      controller.abort();
    });

    return {
      async json<T>(
        input: RequestInfo | URL,
        options: RequestInit = {},
      ): Promise<t.FetchResponse<T>> {
        const errors = Err.errors();
        const url = wrangle.href(input);
        let status = 200;
        let statusText = 'OK';
        let data: T | undefined;

        try {
          const { signal } = controller;
          const fetched = await fetch(url, { ...options, signal });
          status = fetched.status;
          statusText = fetched.statusText;

          if (fetched.ok) {
            data = (await fetched.json()) as T;
          } else {
            fetched.body?.cancel();
            errors.push(fetched);
          }
        } catch (cause: any) {
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
          const method = (options.method ?? 'GET').toUpperCase();
          const name = 'HttpError';
          const message = `HTTP/${method} request failed: ${url}`;
          const headers = toHeaders(options.headers);
          const base = Err.std(message, { name, cause });
          error = { ...base, status, statusText, headers };
        }

        // Finish up.
        const ok = !cause;
        return { ok, status, url, data, error } as t.FetchResponse<T>;
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
  },
};

/**
 * Helpers
 */
const wrangle = {
  href(input: RequestInfo | URL): string {
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
