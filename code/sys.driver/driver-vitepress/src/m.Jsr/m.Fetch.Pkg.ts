import { type t, Err } from './common.ts';

type R = t.JsrFetchResponse<t.JsrPackageMeta>;

export const Pkg: t.JsrFetchPkgLib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  async versions(name) {
    const errors = Err.errors();
    const url = wrangle.url(name);
    let data: t.JsrPackageMeta | undefined;

    const controller = new AbortController();
    const { signal } = controller;
    const fetched = await fetch(url, { signal });
    const { status } = fetched;

    if (fetched.ok) {
      data = (await fetched.json()) as t.JsrPackageMeta;
    } else {
      fetched.body?.cancel();
      errors.push(fetched);
    }

    const error = errors.toError();
    const res: R = {
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
