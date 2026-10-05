import { Str, type t } from '../common.ts';

/**
 * Candidate package paths in deterministic workspace order.
 */
export function candidatePaths(collect: t.WorkspaceBump.CollectResult) {
  const byPath = new Set(collect.candidates.map((candidate) => candidate.pkgPath));
  return orderedKnownPaths(byPath, collect.orderedPaths);
}

/**
 * Known workspace package paths in deterministic workspace order.
 */
export function workspacePaths(
  collect: t.WorkspaceBump.CollectResult,
  candidatePaths: readonly t.StringPath[],
) {
  const known = new Set([...collect.orderedPaths, ...candidatePaths]);
  return orderedKnownPaths(known, collect.orderedPaths);
}

/**
 * Resolve the nearest owning workspace package path for one changed file.
 */
export function ownerOf(file: t.StringPath, pkgPaths: readonly t.StringPath[]) {
  const matches = pkgPaths.filter((pkgPath) => file === pkgPath || file.startsWith(`${pkgPath}/`));
  const compare = Str.Compare.codeUnit();
  return matches.toSorted((a, b) => b.length - a.length || compare(a, b))[0];
}

function orderedKnownPaths(
  known: ReadonlySet<t.StringPath>,
  orderedPaths: readonly t.StringPath[],
) {
  const ordered = orderedPaths.filter((path) => known.has(path));
  const seen = new Set(ordered);
  const compare = Str.Compare.codeUnit();
  const remainder = [...known].filter((path) => !seen.has(path)).toSorted(compare);
  return [...ordered, ...remainder];
}
