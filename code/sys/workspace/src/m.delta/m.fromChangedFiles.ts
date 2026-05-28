import { type t } from './common.ts';
import { dependentClosure } from './u/u.closure.ts';
import { normalizeChangedFiles } from './u/u.files.ts';
import { candidatePaths, ownerOf, workspacePaths } from './u/u.owners.ts';

/**
 * Derive package bump roots and closure from changed workspace-relative files.
 */
export const fromChangedFiles: t.WorkspaceDelta.Lib['fromChangedFiles'] = (args) => {
  const changedFiles = normalizeChangedFiles(args.changedFiles);
  const candidates = candidatePaths(args.collect);
  const candidateSet = new Set(candidates);
  const workspaces = workspacePaths(args.collect, candidates);
  const changed = new Set<t.StringPath>();
  const skipped: t.WorkspaceDelta.Skip[] = [];

  for (const file of changedFiles) {
    const owner = ownerOf(file, workspaces);
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

  const changedPkgPaths = candidates.filter((path) => changed.has(path));
  const bumpRootPkgPaths = [...changedPkgPaths];
  const bumpClosurePkgPaths = dependentClosure(
    bumpRootPkgPaths,
    args.collect.edges,
    args.collect.orderedPaths,
  );

  return { changedFiles, changedPkgPaths, bumpRootPkgPaths, bumpClosurePkgPaths, skipped };
};
