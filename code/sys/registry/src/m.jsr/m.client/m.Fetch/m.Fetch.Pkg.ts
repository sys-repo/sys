import { JsrUrl, type t } from './common.ts';
import { fetchJson, fetchText } from './u.fetch.ts';
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
export const Pkg: t.JsrFetch.Pkg.Lib = Object.freeze({
  /**
   * https://jsr.io/docs/api#package-metadata
   */
  async versions(name, options = {}) {
    const fresh = wrangle.fresh(options, D.fresh.versions);
    const url = wrangle.freshUrl(JsrUrl.Pkg.metadata(name), fresh);
    const res = await fetchJson<t.JsrFetch.Pkg.MetaVersions>(
      url,
      wrangle.freshInit(fresh),
      options.until,
    );
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
    const res = await fetchJson<RawPkgVersionInfo>(
      url,
      wrangle.freshInit(fresh),
      options.until,
    );
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
        const url = JsrUrl.Pkg.file(name, version, path);
        return await fetchText(
          url,
          { checksum: options.checksum },
          [opt.until, options.until],
        );
      },
    };

    return api;
  },
});

/**
 * Helpers:
 */
const wrangle = {
  fresh(options: t.JsrFetch.Pkg.MetadataOptions, defaultValue: boolean): boolean {
    return options.fresh ?? defaultValue;
  },

  freshInit(fresh: boolean): t.HttpFetch.Init {
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
