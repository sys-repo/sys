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
        const url = toHref(input);
        let status = 200;
        let data: T | undefined;

        try {
          const { signal } = controller;
          const fetched = await fetch(url, { ...options, signal });
          status = fetched.status;
          if (fetched.ok) {
            data = (await fetched.json()) as T;
          } else {
            fetched.body?.cancel();
            errors.push(fetched);
          }
        } catch (cause: any) {
          const name = 'HttpError';
          if (_aborted) {
            // HTTP: Client Closed Request.
            status = 499;
            const err = Err.std('Fetch operation disposed of before completing (499)', { name });
            errors.push(err);
          } else {
            // HTTP: Unknown Error.
            status = 520;
            const err = Err.std(`Failed while fetching: ${url}`, { cause, name });
            errors.push(err);
          }
        }

        // Finish up.
        const error = errors.toError();
        const ok = !error;
        return { ok, status, url, data, error };
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
    } as const;
  },
};

function toHref(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  } else if (input instanceof Request) {
    return input.url;
  } else if (input instanceof URL) {
    return input.href;
  }
  throw new Error('Unsupported input type');
}
