import { Err, Fetch, JsrUrl, type t } from './common.ts';
import { graph, type RawPkgVersionInfo } from './u.graph.ts';

const D = {
  fresh: {
    versions: true,
    latestInfo: true,
    exactInfo: false,
  },
} as const;

/**
 * Network fetching helpers against a specific JSR package.
 */
export const Pkg: t.JsrFetch.Pkg.Lib = {
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  async versions(name, options = {}) {
    const fresh = wrangle.fresh(options, D.fresh.versions);
    const url = wrangle.freshUrl(JsrUrl.Pkg.metadata(name), fresh);
    const fetch = Fetch.make(options.until);
    const res = await fetch.json<t.JsrFetch.Pkg.MetaVersions>(url, wrangle.freshInit(fresh));
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
    } as t.JsrFetch.Pkg.VersionsResponse;
  },

  /**
   * https://jsr.io/docs/api#package-version-metadata
   */
  async info(name, vInput, options = {}) {
    const latest = !vInput;
    const version = vInput ? vInput : ((await Pkg.versions(name, options)).data?.latest ?? '');
    const fresh = wrangle.fresh(options, latest ? D.fresh.latestInfo : D.fresh.exactInfo);
    const url = wrangle.freshUrl(JsrUrl.Pkg.version(name, version), fresh);
    const fetch = Fetch.make(options.until);
    const res = await fetch.json<RawPkgVersionInfo>(url, wrangle.freshInit(fresh));
    if (!res.data) return res;

    const pkg: t.Pkg = { name, version: version ?? '' };
    const data: t.JsrFetch.Pkg.VersionInfo = {
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
    const api: t.JsrFetch.Pkg.FileFetcher = {
      pkg: { name, version },
      async text(path, options = {}) {
        const { checksum } = options;
        const errors = Err.errors();
        const fetch = Fetch.make([opt.until, options.until]);
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

/**
 * Helpers:
 */
const wrangle = {
  fresh(options: t.JsrFetch.Pkg.MetadataOptions, defaultValue: boolean): boolean {
    return options.fresh ?? defaultValue;
  },

  freshInit(fresh: boolean): RequestInit {
    if (!fresh) return {};
    return {
      cache: 'reload',
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
    };
  },

  freshUrl(url: t.StringUrl, fresh: boolean): t.StringUrl {
    if (!fresh) return url;
    const next = new URL(url);
    next.searchParams.set('sys-cache-bust', Date.now().toString(36));
    return next.href as t.StringUrl;
  },
} as const;
