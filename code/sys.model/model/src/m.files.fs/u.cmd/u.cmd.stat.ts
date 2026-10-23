import { type t } from '../common.ts';
import { entryFromStat } from '../u/u.entry.ts';
import { fail } from '../u/u.error.ts';
import { allowed } from '../u/u.policy.ts';
import { absolutePath, assertRealInside, requiredVisiblePath, type Scope } from '../u/u.path.ts';

/**
 * Implementation of the `files:stat` command.
 */
export const stat = async (
  scope: Scope,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Stat.Payload,
): Promise<t.Files.Cmd.Stat.Result> => {
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
