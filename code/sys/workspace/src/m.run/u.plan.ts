import { Arr, Err, Fs, Is, Obj, type t } from './common.ts';

/** One selected workspace package prepared for task execution. */
export type RunCandidate = {
  readonly dir: t.StringDir;
  readonly pkg: t.Pkg;
  readonly deno: Record<string, unknown>;
};

/** Immutable package execution plan derived from persisted graph truth. */
export type RunPlan = {
  readonly candidates: readonly RunCandidate[];
  readonly orderedPaths: readonly t.StringPath[];
  readonly edges: readonly t.WorkspaceGraph.PersistedEdge[];
};

export type CreateRunPlanArgs = {
  readonly cwd: t.StringDir;
  readonly graph: t.WorkspaceGraph.PersistedGraph;
  readonly task: t.WorkspaceRun.Task;
  readonly filter?: t.WorkspaceRun.Filter.Predicate;
};

export type CreateRunPlanFromCandidatesArgs = {
  readonly graph: t.WorkspaceGraph.PersistedGraph;
  readonly candidates: readonly RunCandidate[];
};

/**
 * Build the task run plan consumed by sequential and parallel runners.
 *
 * Reads package manifests in graph order, applies the optional package filter,
 * and restricts dependency edges to the selected package set.
 */
export async function createRunPlan(args: CreateRunPlanArgs): Promise<RunPlan> {
  const candidates = await wrangle.candidates(
    args.cwd,
    args.task,
    args.graph.orderedPaths,
    args.filter,
  );
  return createRunPlanFromCandidates({ graph: args.graph, candidates });
}

/** Create a run plan from already-loaded candidates. Used by scheduler tests. */
export function createRunPlanFromCandidates(args: CreateRunPlanFromCandidatesArgs): RunPlan {
  const candidateByPath = new Map(args.candidates.map((item) => [item.dir, item] as const));
  const candidates: RunCandidate[] = [];

  for (const path of args.graph.orderedPaths) {
    const candidate = candidateByPath.get(path as t.StringDir);
    if (candidate) candidates.push(candidate);
  }

  const selected = new Set(candidates.map((item) => item.dir));
  const edges = args.graph.edges.filter((edge) => selected.has(edge.from) && selected.has(edge.to));

  return {
    candidates,
    orderedPaths: Arr.uniq(candidates.map((item) => item.dir)),
    edges,
  };
}

/** Helpers: */
const wrangle = {
  async candidates(
    cwd: t.StringDir,
    task: t.WorkspaceRun.Task,
    paths: readonly t.StringPath[],
    filter?: t.WorkspaceRun.Filter.Predicate,
  ): Promise<RunCandidate[]> {
    const candidates: RunCandidate[] = [];

    for (const path of paths) {
      const dir = path as t.StringDir;
      const deno = await wrangle.readManifest(Fs.join(cwd, dir, 'deno.json'));
      const pkg = wrangle.pkg(deno, dir);
      if (filter && !filter({ dir, pkg, task })) continue;
      candidates.push({ dir, pkg, deno });
    }

    return candidates;
  },

  async readManifest(path: t.StringPath): Promise<Record<string, unknown>> {
    const res = await Fs.readJson<Record<string, unknown>>(path);
    if (res.error) {
      throw Err.std(`Workspace.Run: failed to read deno.json: ${path}`, { cause: res.error });
    }
    return Obj.clone(res.data ?? {}) as Record<string, unknown>;
  },

  pkg(deno: Record<string, unknown>, dir: t.StringDir): t.Pkg {
    const name = deno.name;
    const version = deno.version;
    if (!Is.str(name) || !name.trim()) {
      throw Err.std(`Workspace.Run: package missing name: ${dir}`);
    }
    if (!Is.str(version) || !version.trim()) {
      throw Err.std(`Workspace.Run: package missing version: ${dir}`);
    }
    return { name, version };
  },
} as const;
