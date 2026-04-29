import { Err, Fetch, type t } from './common.ts';
import { Url } from './m.Url.ts';

type MetadataResponse = {
  name: string;
  'dist-tags'?: { latest?: string };
  versions?: Record<string, { deprecated?: string }>;
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
export const Pkg: t.NpmFetch.PkgLib = {
  async versions(name, options = {}) {
    const url = Url.Pkg.metadata(name);
    const fetch = Fetch.make(options.until);
    const res = await fetch.json<MetadataResponse>(url, { cache: 'no-store' });
    if (!res.data) return res;

    const data: t.NpmFetch.PkgMetaVersions = {
      name: res.data.name,
      latest: String(res.data['dist-tags']?.latest ?? ''),
      get versions() {
        return wrangle.versions(res.data?.versions);
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
    const fetch = Fetch.make(options.until);
    const res = await fetch.json<VersionResponse>(url, { cache: 'no-store' });
    if (!res.data) return res;

    const pkg: t.Pkg = { name, version };
    const data: t.NpmFetch.PkgVersionInfo = {
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
  versions(input: MetadataResponse['versions'] = {}) {
    const versions: t.NpmFetch.PkgMetaVersions['versions'] = {};
    for (const [version, value] of Object.entries(input ?? {})) {
      versions[version] = value?.deprecated ? { deprecated: value.deprecated } : {};
    }
    return versions;
  },

  dist(input: VersionResponse['dist']): t.NpmFetch.PkgDistInfo | undefined {
    if (!input) return undefined;
    return {
      tarball: input.tarball,
      integrity: input.integrity,
      shasum: input.shasum,
    };
  },
} as const;
