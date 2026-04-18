import { type t, Fs, Is, Str } from './common.ts';

const compare = Str.Compare.codeUnit();

type NormalizeInput = {
  readonly cwd: t.StringDir;
  readonly packages: readonly t.WorkspaceGraph.Package[];
  readonly info: t.WorkspaceGraphCli.InfoJson;
};

export function normalizeGraph(input: NormalizeInput): t.WorkspaceGraph.LocalModuleGraph {
  const rootKeys = wrangle.rootKeys(input.cwd, input.packages, input.info.roots ?? []);
  const modules = wrangle.modules(input.cwd, input.packages, input.info, rootKeys);
  const moduleSet = new Set(modules.map((module) => module.key));
  const edges = wrangle.edges(input.cwd, input.packages, input.info, moduleSet);

  return {
    cwd: input.cwd,
    packages: [...input.packages],
    roots: [...rootKeys].toSorted(compare),
    modules,
    edges,
  };
}

const wrangle = {
  rootKeys(cwd: t.StringDir, packages: readonly t.WorkspaceGraph.Package[], roots: readonly string[]) {
    const keys = roots.flatMap((specifier) => {
      const key = toModuleKey(cwd, packages, specifier);
      return key ? [key] : [];
    });
    return new Set(keys);
  },

  modules(
    cwd: t.StringDir,
    packages: readonly t.WorkspaceGraph.Package[],
    info: t.WorkspaceGraphCli.InfoJson,
    rootKeys: ReadonlySet<string>,
  ) {
    const keys = new Set<string>(rootKeys);
    for (const mod of info.modules ?? []) {
      if (!Is.str(mod.specifier)) continue;
      const key = toModuleKey(cwd, packages, mod.specifier);
      if (key) keys.add(key);
    }

    return [...keys]
      .map((key) => ({
        key,
        packagePath: packageForModule(packages, key)!.path,
      }))
      .toSorted((a, b) => compare(a.key, b.key));
  },

  edges(
    cwd: t.StringDir,
    packages: readonly t.WorkspaceGraph.Package[],
    info: t.WorkspaceGraphCli.InfoJson,
    moduleSet: ReadonlySet<string>,
  ) {
    const seen = new Set<string>();
    const edges: t.WorkspaceGraph.ModuleEdge[] = [];

    for (const mod of info.modules ?? []) {
      if (!Is.str(mod.specifier)) continue;
      const from = toModuleKey(cwd, packages, mod.specifier);
      if (!from || !moduleSet.has(from)) continue;

      for (const dep of mod.dependencies ?? []) {
        for (const kind of ['code', 'type'] as const) {
          const specifier = dep[kind]?.specifier;
          if (!Is.str(specifier)) continue;
          const to = toModuleKey(cwd, packages, specifier);
          if (!to || !moduleSet.has(to)) continue;
          const key = `${kind}:${from}->${to}`;
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push({ from, to, kind });
        }
      }
    }

    return edges.toSorted((a, b) =>
      compare(a.from, b.from) || compare(a.to, b.to) || compare(a.kind, b.kind)
    );
  },
} as const;

function toModuleKey(cwd: string, packages: readonly t.WorkspaceGraph.Package[], specifier: string) {
  if (!specifier.startsWith('file://')) return;
  const key = Fs.Path.relative(cwd, Fs.Path.fromFileUrl(specifier)).replaceAll('\\', '/');
  return packageForModule(packages, key)?.path ? key : undefined;
}

function packageForModule(packages: readonly t.WorkspaceGraph.Package[], key: string) {
  // Keep the lookup simple at current workspace scale; if this ever becomes
  // hot, replace the per-call sort with a precomputed longest-prefix index.
  return [...packages]
    .toSorted((a, b) => b.path.length - a.path.length || compare(a.path, b.path))
    .find((pkg) => key === pkg.path || key.startsWith(`${pkg.path}/`));
}
