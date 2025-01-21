import { type t, Fetch, Url } from './common.ts';

/**
 * Network fetching helpers against a specific JSR package.
 */
export const Pkg: t.JsrFetchPkgLib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  async versions(name, options = {}) {
    const url = Url.Pkg.metadata(name);
    const fetch = Fetch.disposable(options.dispose$);
    const res = await fetch.json<t.JsrPkgMetaVersions>(url);
    const data = res.data
      ? {
          ...res.data,
          get versions() {
            // NB: prevent display blow-outs if console logging the response object.
            return res.data.versions;
          },
        }
      : undefined;
    return { ...res, data } as t.JsrFetchPkgVersionsResponse;
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

    const pkg: t.Pkg = { name, version: version ?? '' };
    const data: t.JsrPkgVersionInfo = {
      ...res.data,
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
