import { type t, Fetch } from './common.ts';
import { Url } from './m.Url.ts';

export const Pkg: t.JsrFetchPkgLib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  versions(name, options = {}) {
    const url = Url.Pkg.metadata(name);
    const fetch = Fetch.disposable(options.dispose$);
    return fetch.json<t.JsrPkgMetaVersions>(url);
  },

  /**
   * https://jsr.io/docs/api#package-version-metadata
   */
  async info(name, vInput, options = {}) {
    const version = vInput ? vInput : (await Pkg.versions(name)).data?.latest ?? '';
    const url = Url.Pkg.version(name, version);
    const fetch = Fetch.disposable(options.dispose$);
    const res = await fetch.json<t.JsrPkgVersionInfo>(url);
    if (!res.data) return res;

    const scope = wrangle.scope(name);
    const pkg: t.Pkg = { name, version: version ?? '' };
    const data: t.JsrPkgVersionInfo = {
      ...res.data,
      scope,
      pkg,

      get manifest() {
        return res.data?.manifest;
      },
      get exports() {
        return res.data?.exports;
      },
      get moduleGraph1() {
        return res.data?.moduleGraph1;
      },
      get moduleGraph2() {
        return res.data?.moduleGraph2;
      },
    };

    return { ...res, data };
  },
};

/**
 * Helpers
 */
const wrangle = {
  scope: (input: string) => input.split('/')[0],
  name: (input: string) => input.split('/')[1],
} as const;
