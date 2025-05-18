import { type t, Err, Fetch, JsrUrl } from './common.ts';

/**
 * Network fetching helpers against a specific JSR package.
 */
export const Pkg: t.JsrFetchPkgLib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  async versions(name, options = {}) {
    const url = JsrUrl.Pkg.metadata(name);
    const fetch = Fetch.create(options.dispose$);
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
    return {
      ...res,
      get headers() {
        return res.headers;
      },
      data,
    } as t.JsrFetchPkgVersionsResponse;
  },

  /**
   * https://jsr.io/docs/api#package-version-metadata
   */
  async info(name, vInput, options = {}) {
    const version = vInput ? vInput : (await Pkg.versions(name)).data?.latest ?? '';
    const url = JsrUrl.Pkg.version(name, version);
    const fetch = Fetch.create(options.dispose$);
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

    return {
      ...res,
      get headers() {
        return res.headers;
      },
      data,
    };
  },

  /**
   * https://jsr.io/docs/api#modules
   */
  file(name, version, opt = {}) {
    const api: t.JsrPkgFileFetcher = {
      pkg: { name, version },
      async text(path, options = {}) {
        const { checksum } = options;
        const errors = Err.errors();
        const fetch = Fetch.create([opt.dispose$, options.dispose$]);
        const url = JsrUrl.Pkg.file(name, version, path);

        let res = await fetch.text(url, {}, { checksum });
        let status = res.status;

        if (errors.ok) return res;
        if (res.error) errors.push(res.error);
        return {
          ...res,
          ok: false,
          status,
          path,
          get headers() {
            return res.headers;
          },
          error: errors.toError(),
        } as any; // NB: type-hack, error.
      },
    };

    return api;
  },
};
