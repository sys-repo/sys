import { Obj, type t } from './common.ts';
import { Url } from './m.Url.ts';
import { fetchJson } from './u.fetch.ts';

type MetadataResponse = {
  name: string;
  'dist-tags'?: { latest?: string };
  versions?: Record<string, { deprecated?: string }>;
  time?: Record<string, string>;
};

type VersionResponse = {
  name?: string;
  version?: string;
  dist?: {
    tarball?: string;
    integrity?: string;
    shasum?: string;
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  exports?: unknown;
};

/**
 * Network fetching helpers against a specific npm package.
 */
export const Pkg: t.NpmFetch.Pkg.Lib = {
  async versions(name, options = {}) {
    const url = Url.Pkg.metadata(name);
    const res = await fetchJson<MetadataResponse>(url, { cache: 'no-store' }, options.until);
    if (!res.data) return res;

    const data: t.NpmFetch.Pkg.MetaVersions = {
      name: res.data.name,
      latest: String(res.data['dist-tags']?.latest ?? ''),
      get versions() {
        return wrangle.versions(res.data?.versions, res.data?.time);
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

  async info(name, vInput, options = {}) {
    const version = vInput ? vInput : ((await Pkg.versions(name, options)).data?.latest ?? '');
    const url = Url.Pkg.version(name, version);
    const res = await fetchJson<VersionResponse>(url, { cache: 'no-store' }, options.until);
    if (!res.data) return res;

    const pkg: t.Pkg = { name, version };
    const data: t.NpmFetch.Pkg.VersionInfo = {
      pkg,
      dist: wrangle.dist(res.data.dist),
      dependencies: res.data.dependencies,
      devDependencies: res.data.devDependencies,
      exports: res.data.exports,
    };

    return {
      ...res,
      get headers() {
        return res.headers;
      },
      data,
    };
  },
};

const wrangle = {
  versions(input: MetadataResponse['versions'] = {}, time: MetadataResponse['time'] = {}) {
    const versions: t.NpmFetch.Pkg.MetaVersions['versions'] = {};
    for (const [version, value] of Obj.entries(input ?? {})) {
      const publishedAt = time?.[version];
      versions[version] = {
        ...(value?.deprecated ? { deprecated: value.deprecated } : {}),
        ...(publishedAt ? { publishedAt } : {}),
      };
    }
    return versions;
  },

  dist(input: VersionResponse['dist']): t.NpmFetch.Pkg.DistInfo | undefined {
    if (!input) return undefined;
    return {
      tarball: input.tarball,
      integrity: input.integrity,
      shasum: input.shasum,
    };
  },
} as const;
