import { type t } from '../common.ts';
import { entryFromStat } from '../u.entry.ts';
import { fail } from '../u.error.ts';
import { allowed } from '../u.policy.ts';
import { absolutePath, assertRealInside, requiredVisiblePath, type Scope } from '../u.path.ts';

/**
 * Implementation of the `files:stat` command.
 */
export const stat = async (
  scope: Scope,
  policy: t.FilesPolicy.Shape,
  payload: t.FilesCmd.Stat.Payload,
): Promise<t.FilesCmd.Stat.Result> => {
  const path = requiredVisiblePath(scope.fs, payload.path);
  if (!allowed(policy, 'stat', path)) {
    throw fail('FilesFsError.PolicyDenied', `Stat denied: ${path}`);
  }

  const absolute = absolutePath(scope, path);
  const real = await assertRealInside(scope, absolute);
  if (!real) throw fail('FilesFsError.NotFound', `File not found: ${path}`);

  const info = await scope.fs.stat(real);
  if (!info) throw fail('FilesFsError.NotFound', `File not found: ${path}`);
  return { entry: entryFromStat(path, info) };
};
