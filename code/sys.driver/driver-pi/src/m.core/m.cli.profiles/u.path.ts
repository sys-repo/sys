import { Fs, type t } from './common.ts';
import { runtimeRoot } from '../m.cli/u.runtime-root.ts';

/**
 * Profile YAML path contract.
 *
 * Paths authored inside a profile are policy paths. They resolve from the
 * runtime root, never from the shell directory where Pi was invoked.
 *
 * This does not govern the --config CLI argument itself; that remains an
 * invocation path resolved by the profile launcher boundary.
 */
export const ProfilePath = {
  root(cwd: t.PiCli.Cwd): t.StringDir {
    return runtimeRoot(cwd, 'Pi profile');
  },

  resolve(root: t.StringDir, path: t.StringPath): t.StringPath {
    return Fs.resolve(root, path) as t.StringPath;
  },

  resolveAll(root: t.StringDir, paths?: readonly t.StringPath[]): readonly t.StringPath[] {
    return (paths ?? []).map((path) => ProfilePath.resolve(root, path));
  },
} as const;
