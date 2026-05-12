import { Path, type t } from '../common.ts';

/** Resolve the absolute endpoint staging root. */
export function resolveStagingRoot(args: {
  readonly cwd: t.StringDir;
  readonly stagingRootRel: string;
}): t.StringDir {
  const root = String(args.stagingRootRel ?? '').trim() || '.';
  return Path.resolve(args.cwd, root) as t.StringDir;
}
