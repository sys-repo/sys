import { type t, Err, Fetch, Hash, Url } from './common.ts';

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

  /**
   * https://jsr.io/docs/api#modules
   */
  file(name, version, opt = {}) {
    const api: t.JsrPkgFileFetcher = {
      pkg: { name, version },
      async text(path, options = {}) {
        const errors = Err.errors();
        const fetch = Fetch.disposable([opt.dispose$, options.dispose$]);
        const url = Url.Pkg.file(name, version, path);

        let res = await fetch.text(url);
        let status = res.status;

        if (options.checksum) {
          const hx = Hash.sha256(res.data);
          if (hx !== options.checksum) {
            status = 412;
            let msg = '412:Pre-condition failed (checksum-mismatch). ';
            msg += `The hash of the fetched content for "${path}" (${hx}) does not match the given checksum: ${options.checksum}`;
            errors.push(msg);
          }
        }

        if (errors.ok) return res;
        if (res.error) errors.push(res.error);
        return {
          ...res,
          ok: false,
          status,
          error: errors.toError(),
        } as any;
      },
    };
    return api;
  },
};
