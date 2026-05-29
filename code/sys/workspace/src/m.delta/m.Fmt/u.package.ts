import { type t } from './common.ts';
import { classification } from './u.classification.ts';

export type CandidateMap = ReadonlyMap<t.StringPath, t.WorkspaceBump.Candidate>;

/** Index candidates by package path for deterministic explanation labels. */
export function candidateMap(candidates: readonly t.WorkspaceBump.Candidate[]): CandidateMap {
  return new Map(candidates.map((candidate) => [candidate.pkgPath, candidate]));
}

/** Render the selected bump roots as package names when available. */
export function rootSummary(paths: readonly t.StringPath[], candidates: CandidateMap) {
  if (paths.length === 0) return '0';
  return paths.map((path) => candidates.get(path)?.name ?? path).join(', ');
}

/** Render one package explanation header with its classification. */
export function packageHeader(
  pkgPath: t.StringPath,
  delta: t.WorkspaceDelta.Git.FromRefResult,
  candidates: CandidateMap,
) {
  const name = candidates.get(pkgPath)?.name ?? pkgPath;
  return `${name}  ${pkgPath}  ${classification(pkgPath, delta)}`;
}
