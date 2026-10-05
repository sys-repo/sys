import { Graph } from '../../m.prep/m.Graph.ts';
import {
  resolveWorkspaceManifestPath,
  resolveWorkspaceMembers,
} from '../../u.workspace.members.ts';
import { Fs, Is, Semver, type t } from '../common.ts';

export const collect: t.WorkspaceBump.Lib['collect'] = async (args = {}) => {
  const cwd = args.cwd ?? Fs.cwd();
  const release = args.release ?? 'patch';
  const graph = await wrangle.graph({ cwd, orderedPaths: args.orderedPaths, edges: args.edges });
  const couplings = wrangle.couplings(args.policy?.couplings, graph.orderedPaths);
  const orderedPaths = bumpOrderedPaths(graph.orderedPaths, couplings);
  const edges = [...graph.edges, ...couplings];
  const workspaceManifestPath = await resolveWorkspaceManifestPath(cwd);
  const workspace = await resolveWorkspaceMembers(workspaceManifestPath);

  const exclude = args.policy?.exclude ?? (() => false);
  const candidates = orderCandidates(
    workspace.members
      .filter((member) => !exclude(member.path))
      .flatMap((member) => {
        const version = member.manifest.version;
        const name = member.manifest.name;
        if (!Is.str(version) || !Is.str(name)) return [];
        const current = Semver.parse(version).version;
        return {
          pkgPath: member.path,
          denoFilePath: member.manifestPath,
          name,
          version: { current, next: increment(current, release) },
        };
      }),
    orderedPaths,
  );

  return { cwd, release, orderedPaths, edges, candidates };
};

export function orderCandidates<T extends { pkgPath: t.StringPath }>(
  candidates: readonly T[],
  orderedPaths: readonly t.StringPath[],
) {
  const candidateByPath = new Map(
    candidates.map((candidate) => [candidate.pkgPath, candidate] as const),
  );
  const ordered = orderedPaths.flatMap((path) => {
    const candidate = candidateByPath.get(path);
    return candidate ? [candidate] : [];
  });
  const seen = new Set(ordered.map((candidate) => candidate.pkgPath));
  const remainder = candidates
    .filter((candidate) => !seen.has(candidate.pkgPath))
    .toSorted((a, b) => a.pkgPath.localeCompare(b.pkgPath));
  return [...ordered, ...remainder];
}

export function bumpOrderedPaths(
  orderedPaths: readonly t.StringPath[],
  couplings: readonly t.WorkspaceBump.PackageEdge[] = [],
) {
  const indexByPath = new Map(orderedPaths.map((path, index) => [path, index] as const));
  const active = couplings.filter((edge) => indexByPath.has(edge.from) && indexByPath.has(edge.to));
  if (active.length === 0) return [...orderedPaths];

  const indegree = new Map<t.StringPath, number>(orderedPaths.map((path) => [path, 0] as const));
  const outgoing = new Map<t.StringPath, t.StringPath[]>(
    orderedPaths.map((path) => [path, [] as t.StringPath[]] as const),
  );

  for (const edge of active) {
    outgoing.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }

  const ready = orderedPaths.filter((path) => (indegree.get(path) ?? 0) === 0);
  const ordered: t.StringPath[] = [];

  while (ready.length > 0) {
    const next = ready.shift()!;
    ordered.push(next);

    for (const to of outgoing.get(next) ?? []) {
      const pending = (indegree.get(to) ?? 0) - 1;
      indegree.set(to, pending);
      if (pending !== 0) continue;
      const insertAt = ready.findIndex(
        (path) => (indexByPath.get(path) ?? 0) > (indexByPath.get(to) ?? 0),
      );
      if (insertAt === -1) ready.push(to);
      else ready.splice(insertAt, 0, to);
    }
  }

  return ordered.length === orderedPaths.length ? ordered : [...orderedPaths];
}

export function increment(current: t.Semver, release: t.SemverReleaseType) {
  const isPrerelease = (current.prerelease ?? []).length > 0;
  const bump = release === 'patch' && isPrerelease ? 'prerelease' : release;
  return Semver.increment(current, bump);
}

/**
 * Helpers:
 */
const wrangle = {
  async graph(args: {
    readonly cwd: t.StringDir;
    readonly orderedPaths?: readonly t.StringPath[];
    readonly edges?: readonly t.WorkspaceBump.PackageEdge[];
  }) {
    if (args.orderedPaths && args.edges) {
      return { orderedPaths: [...args.orderedPaths], edges: [...args.edges] };
    }

    const built = await Graph.build(args.cwd);
    return {
      orderedPaths: args.orderedPaths ? [...args.orderedPaths] : built.orderedPaths,
      edges: args.edges ? [...args.edges] : built.edges,
    };
  },

  couplings(
    couplings: readonly t.WorkspaceBump.PackageEdge[] | undefined,
    orderedPaths: readonly t.StringPath[],
  ) {
    if (!couplings || couplings.length === 0) return [];
    const known = new Set(orderedPaths);
    return couplings.filter((edge) => known.has(edge.from) && known.has(edge.to));
  },
} as const;
