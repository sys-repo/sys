import { type t, Err, Fetch, Is, JsrUrl } from './common.ts';

type RawPkgVersionInfo = {
  manifest?: t.JsrFetch.PkgManifest;
  exports?: Record<string, string>;
  moduleGraph1?: unknown;
  moduleGraph2?: unknown;
};

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
      graph: wrangle.graph(res.data),
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

const wrangle = {
  graph(input: RawPkgVersionInfo): t.JsrFetch.PkgGraph | undefined {
    return wrangle.graph2(input.moduleGraph2) ?? wrangle.graph1(input.moduleGraph1);
  },

  graph2(input: unknown): t.JsrFetch.PkgGraph | undefined {
    const modules = wrangle.graph2Modules(input);
    if (!modules) return undefined;
    return { format: 2, modules };
  },

  graph2Modules(input: unknown): readonly t.JsrFetch.PkgGraphModule[] | undefined {
    if (Array.isArray(input)) return wrangle.modules(input);
    if (!Is.record(input)) return undefined;
    const graph = input as Record<string, unknown>;
    const keyed = wrangle.modulesFromRecord(graph);
    if (keyed.length > 0) return keyed;
    if (Array.isArray(graph.modules)) return wrangle.modules(graph.modules);
    if (Array.isArray(graph.graph)) return wrangle.modules(graph.graph);
    if (Array.isArray(graph.roots)) return wrangle.modules(graph.roots);
    return undefined;
  },

  modules(input: readonly unknown[]): readonly t.JsrFetch.PkgGraphModule[] {
    return input
      .map(wrangle.module)
      .filter((value): value is t.JsrFetch.PkgGraphModule => Boolean(value))
      .sort((a, b) => a.path.localeCompare(b.path));
  },

  module(input: unknown): t.JsrFetch.PkgGraphModule | undefined {
    if (!Is.record(input)) return undefined;
    const item = input as Record<string, unknown>;
    const path = wrangle.modulePath(item);
    if (!path) return undefined;
    return {
      path,
      dependencies: wrangle.dependencies(item.dependencies ?? item.imports),
    };
  },

  modulePath(input: Record<string, unknown>): string | undefined {
    const value = input.path ?? input.specifier ?? input.url;
    return Is.str(value) && value ? value : undefined;
  },

  graph1(input: unknown): t.JsrFetch.PkgGraph | undefined {
    if (!Is.record(input)) return undefined;
    const graph = input as Record<string, unknown>;
    const modules = wrangle.modulesFromRecord(graph);
    return { format: 1, modules };
  },

  modulesFromRecord(input: Record<string, unknown>): readonly t.JsrFetch.PkgGraphModule[] {
    return Object.entries(input)
      .map(([path, value]) => ({
        path,
        dependencies: wrangle.recordDependencies(value),
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  },

  recordDependencies(input: unknown): readonly t.JsrFetch.PkgGraphDependency[] {
    if (Is.record(input) && Array.isArray(input.dependencies)) return wrangle.depList(input.dependencies);
    return wrangle.dependencies(input);
  },

  dependencies(input: unknown): readonly t.JsrFetch.PkgGraphDependency[] {
    if (Array.isArray(input)) return wrangle.depList(input);
    if (!Is.record(input)) return [];
    return Object.keys(input)
      .filter((specifier) => specifier.length > 0)
      .sort((a, b) => a.localeCompare(b))
      .map((specifier) => ({ specifier }));
  },

  depList(input: readonly unknown[]): readonly t.JsrFetch.PkgGraphDependency[] {
    return input
      .map(wrangle.dep)
      .filter((value): value is t.JsrFetch.PkgGraphDependency => Boolean(value))
      .sort((a, b) => a.specifier.localeCompare(b.specifier));
  },

  dep(input: unknown): t.JsrFetch.PkgGraphDependency | undefined {
    if (Is.str(input) && input) return { specifier: input };
    if (!Is.record(input)) return undefined;
    const item = input as Record<string, unknown>;
    const specifier = item.specifier ?? item.path ?? item.url;
    if (!Is.str(specifier) || !specifier) return undefined;
    const kind = item.kind;
    return Is.str(kind) && kind ? { specifier, kind } : { specifier };
  },
} as const;
