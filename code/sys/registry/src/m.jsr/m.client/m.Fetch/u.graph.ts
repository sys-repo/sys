import { Is, type t } from './common.ts';

export type RawPkgVersionInfo = {
  manifest?: t.JsrFetch.PkgManifest;
  exports?: Record<string, string>;
  moduleGraph1?: unknown;
  moduleGraph2?: unknown;
};

export const graph = {
  fromRaw(input: RawPkgVersionInfo): t.JsrFetch.PkgGraph | undefined {
    return graph.fromGraph2(input.moduleGraph2) ?? graph.fromGraph1(input.moduleGraph1);
  },

  fromGraph2(input: unknown): t.JsrFetch.PkgGraph | undefined {
    const modules = graph.graph2Modules(input);
    if (!modules) return undefined;
    return { format: 2, modules };
  },

  fromGraph1(input: unknown): t.JsrFetch.PkgGraph | undefined {
    if (!Is.record(input)) return undefined;
    const modules = graph.modulesFromRecord(input);
    return { format: 1, modules };
  },

  graph2Modules(input: unknown): readonly t.JsrFetch.PkgGraphModule[] | undefined {
    if (Array.isArray(input)) return graph.modules(input);
    if (!Is.record(input)) return undefined;
    const keyed = graph.modulesFromRecord(input);
    if (keyed.length > 0) return keyed;
    if (Array.isArray(input.modules)) return graph.modules(input.modules);
    if (Array.isArray(input.graph)) return graph.modules(input.graph);
    if (Array.isArray(input.roots)) return graph.modules(input.roots);
    return undefined;
  },

  modules(input: readonly unknown[]): readonly t.JsrFetch.PkgGraphModule[] {
    return input
      .map(graph.module)
      .filter((value): value is t.JsrFetch.PkgGraphModule => Boolean(value))
      .sort((a, b) => a.path.localeCompare(b.path));
  },

  module(input: unknown): t.JsrFetch.PkgGraphModule | undefined {
    if (!Is.record(input)) return undefined;
    const path = graph.modulePath(input);
    if (!path) return undefined;
    return {
      path,
      dependencies: graph.recordDependencies(input),
    };
  },

  modulePath(input: Record<string, unknown>): string | undefined {
    const value = input.path ?? input.specifier ?? input.url;
    return Is.str(value) && value ? value : undefined;
  },

  modulesFromRecord(input: Record<string, unknown>): readonly t.JsrFetch.PkgGraphModule[] {
    return Object.entries(input)
      .map(([path, value]) => ({
        path,
        dependencies: graph.recordDependencies(value),
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  },

  recordDependencies(input: unknown): readonly t.JsrFetch.PkgGraphDependency[] {
    if (Is.record(input) && Array.isArray(input.dependencies)) return graph.depList(input.dependencies);
    return graph.dependencies(input);
  },

  dependencies(input: unknown): readonly t.JsrFetch.PkgGraphDependency[] {
    if (Array.isArray(input)) return graph.depList(input);
    if (!Is.record(input)) return [];
    return Object.keys(input)
      .filter((specifier) => specifier.length > 0)
      .sort((a, b) => a.localeCompare(b))
      .map((specifier) => ({ specifier }));
  },

  depList(input: readonly unknown[]): readonly t.JsrFetch.PkgGraphDependency[] {
    return input
      .map(graph.dep)
      .filter((value): value is t.JsrFetch.PkgGraphDependency => Boolean(value))
      .sort((a, b) => a.specifier.localeCompare(b.specifier));
  },

  dep(input: unknown): t.JsrFetch.PkgGraphDependency | undefined {
    if (Is.str(input) && input) return { specifier: input };
    if (!Is.record(input)) return undefined;
    const specifier = input.specifier ?? input.path ?? input.url;
    if (!Is.str(specifier) || !specifier) return undefined;
    const kind = input.kind;
    return Is.str(kind) && kind ? { specifier, kind } : { specifier };
  },
} as const;
