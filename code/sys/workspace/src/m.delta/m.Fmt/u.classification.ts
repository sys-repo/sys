import { type t } from './common.ts';

/** Resolve the stable package classification label for delta explanation output. */
export function classification(pkgPath: t.StringPath, delta: t.WorkspaceDelta.Git.FromRefResult) {
  if (delta.needsBumpPkgPaths.includes(pkgPath)) return 'needs bump';
  if (delta.alreadyBumpedPkgPaths.includes(pkgPath)) return 'already bumped';
  if (delta.newPkgPaths.includes(pkgPath)) return 'new';
  return 'changed';
}
