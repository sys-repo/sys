import { type t, Path } from './common.ts';

/**
 * Resolve the absolute staging root used for push.
 * Always targets the root (not a single mapping).
 */
export function resolvePushStagingDir(args: {
  cwd: t.StringDir;
  stagingRootRel: string;
}): t.StringDir {
  const root = String(args.stagingRootRel ?? '').trim() || '.';
  return Path.resolve(args.cwd, root);
}
