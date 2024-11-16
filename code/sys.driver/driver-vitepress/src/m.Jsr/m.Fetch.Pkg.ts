import { type t, Fetch } from './common.ts';

export const Pkg: t.JsrFetchPkgLib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  versions(name, options = {}) {
    const url = wrangle.url(name);
    const fetch = Fetch.disposable(options.dispose$);
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
