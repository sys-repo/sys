import { type t } from './common.ts';
import { dependentClosure } from './u/u.plan.ts';

export const Delta: t.WorkspaceBump.Delta.Lib = {
  fromChangedFiles(args) {
    const changedFiles = wrangle.changedFiles(args.changedFiles);
    const candidatePaths = wrangle.candidatePaths(args.collect);
    const candidateSet = new Set(candidatePaths);
    const workspacePaths = wrangle.workspacePaths(args.collect, candidatePaths);
    const changed = new Set<t.StringPath>();
    const skipped: t.WorkspaceBump.Delta.Skip[] = [];

    for (const file of changedFiles) {
      const owner = wrangle.ownerOf(file, workspacePaths);
      if (!owner) {
        skipped.push({ file, reason: 'outside-workspace-package' });
        continue;
      }
      if (!candidateSet.has(owner)) {
        skipped.push({ file, reason: 'outside-bump-candidates' });
        continue;
      }
      changed.add(owner);
    }

    const changedPkgPaths = candidatePaths.filter((path) => changed.has(path));
    const bumpRootPkgPaths = [...changedPkgPaths];
    const bumpClosurePkgPaths = dependentClosure(
      bumpRootPkgPaths,
      args.collect.edges,
      args.collect.orderedPaths,
    );

    return { changedFiles, changedPkgPaths, bumpRootPkgPaths, bumpClosurePkgPaths, skipped };
  },
};

/**
 * Helpers:
 */
const wrangle = {
  changedFiles(files: readonly t.StringPath[]) {
    return wrangle.unique(files.map(wrangle.normalizeFile).filter((file) => file.length > 0));
  },

  normalizeFile(file: t.StringPath) {
    let path = file.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
    while (path.startsWith('./')) path = path.slice(2);
    return path;
  },

  candidatePaths(collect: t.WorkspaceBump.CollectResult) {
    const byPath = new Set(collect.candidates.map((candidate) => candidate.pkgPath));
    return wrangle.orderedKnownPaths(byPath, collect.orderedPaths);
  },

  workspacePaths(collect: t.WorkspaceBump.CollectResult, candidatePaths: readonly t.StringPath[]) {
    const known = new Set([...collect.orderedPaths, ...candidatePaths]);
    return wrangle.orderedKnownPaths(known, collect.orderedPaths);
  },

  orderedKnownPaths(known: ReadonlySet<t.StringPath>, orderedPaths: readonly t.StringPath[]) {
    const ordered = orderedPaths.filter((path) => known.has(path));
    const seen = new Set(ordered);
    const remainder = [...known].filter((path) => !seen.has(path)).toSorted();
    return [...ordered, ...remainder];
  },

  ownerOf(file: t.StringPath, pkgPaths: readonly t.StringPath[]) {
    const matches = pkgPaths.filter((pkgPath) =>
      file === pkgPath || file.startsWith(`${pkgPath}/`)
    );
    return matches.toSorted((a, b) => b.length - a.length || a.localeCompare(b))[0];
  },

  unique(values: readonly t.StringPath[]) {
    return [...new Set(values)];
  },
} as const;
