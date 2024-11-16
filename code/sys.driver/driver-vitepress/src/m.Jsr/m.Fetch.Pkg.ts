import { type t, Err, rx } from './common.ts';

export const Pkg: t.JsrFetchPkgLib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  async versions(name, options = {}) {
    const errors = Err.errors();
    const url = wrangle.url(name);

    let _aborted = false;
    const life = rx.disposable(options.dispose$);
    const controller = new AbortController();
    life.dispose$.subscribe(() => {
      _aborted = true;
      controller.abort();
    });

    let status = 200;
    let data: t.JsrPackageMeta | undefined;

    try {
      const { signal } = controller;
      const fetched = await fetch(url, { signal });
      status = fetched.status;
      if (fetched.ok) {
        data = (await fetched.json()) as t.JsrPackageMeta;
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
    const res: t.JsrFetchVersionsResponse = {
      status,
      url,
      data,
      error,
    };

    return res;
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
