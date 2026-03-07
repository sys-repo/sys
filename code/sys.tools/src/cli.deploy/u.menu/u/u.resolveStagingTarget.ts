import { type t, Path } from './common.ts';

export function resolveStagingTarget(args: {
  cwd: t.StringDir;
  stagingRootRel: string;
  mappingStagingRel?: string;
}): t.StringDir {
  const root = String(args.stagingRootRel ?? '').trim() || '.';
  const mapping = String(args.mappingStagingRel ?? '').trim() || '.';
  return Path.resolve(args.cwd, root, mapping);
}
