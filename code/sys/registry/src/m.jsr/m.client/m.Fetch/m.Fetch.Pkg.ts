import { type t, Err, Fetch, JsrUrl } from './common.ts';
import { graph, type RawPkgVersionInfo } from './u.graph.ts';

/**
 * Network fetching helpers against a specific JSR package.
 */
export const Pkg: t.JsrFetch.PkgLib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  async versions(name, options = {}) {
    const url = JsrUrl.Pkg.metadata(name);
    const fetch = Fetch.make(options.dispose$);
    const res = await fetch.json<t.JsrFetch.PkgMetaVersions>(url, { cache: 'no-store' });
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
    } as t.JsrFetch.PkgVersionsResponse;
  },

  /**
   * https://jsr.io/docs/api#package-version-metadata
   */
  async info(name, vInput, options = {}) {
    const version = vInput ? vInput : ((await Pkg.versions(name)).data?.latest ?? '');
    const url = JsrUrl.Pkg.version(name, version);
    const fetch = Fetch.make(options.dispose$);
    const res = await fetch.json<RawPkgVersionInfo>(url, { cache: 'no-store' });
    if (!res.data) return res;

    const pkg: t.Pkg = { name, version: version ?? '' };
    const data: t.JsrFetch.PkgVersionInfo = {
      pkg,
      manifest: res.data.manifest,
      exports: res.data.exports,
      graph: graph.fromRaw(res.data),
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
    const api: t.JsrFetch.PkgFileFetcher = {
      pkg: { name, version },
      async text(path, options = {}) {
        const { checksum } = options;
        const errors = Err.errors();
        const fetch = Fetch.make([opt.dispose$, options.dispose$]);
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
