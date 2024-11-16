import { type t, Err, rx } from './common.ts';

export const Pkg: t.JsrFetchPkgLib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  versions(name, options = {}) {
    const url = wrangle.url(name);
    const life = rx.disposable(options.dispose$);
    const fetch = Fetch.disposable(life.dispose$);
    return fetch.json<t.JsrPackageMeta>(url);
  },
};

/**
 * Helpers
 */
const wrangle = {
  url(name: string, version?: string) {
    const base = `https://jsr.io/${name}`;
    const path = version ? `${version}_meta.json` : 'meta.json';
    return `${base}/${path}`;
  },
} as const;

/**
 * TODO 🐷 Move to @sys/std/http
 */
const Fetch = {
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
          if (_aborted) {
            // HTTP: Client Closed Request.
            status = 499;
            errors.push('Fetch operation disposed of before completing (499)');
          } else {
            // HTTP: Unknown Error.
            status = 520;
            errors.push(`Failed while fetching: ${url}`, { cause });
          }
        }

        const error = errors.toError();
        const res: t.FetchResponse<T> = {
          status,
          url,
          data,
          error,
        };
        return res;
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
