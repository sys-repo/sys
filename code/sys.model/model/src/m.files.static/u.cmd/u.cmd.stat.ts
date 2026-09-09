import { allowed } from '../../m.files/u/u.policy.ts';
import { type t } from '../common.ts';
import { fail } from '../u/u.error.ts';
import type { StaticIndex } from '../u/u.index.ts';
import { requiredVisiblePath } from '../u/u.path.ts';

/** Implementation of the `files:stat` command for static dist metadata. */
export const stat = (
  index: StaticIndex,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Stat.Payload,
): t.Files.Cmd.Stat.Result => {
  const path = requiredVisiblePath(payload.path);
  if (!allowed(policy, 'stat', path)) {
    throw fail('FilesStaticError.PolicyDenied', `Stat denied: ${path}`);
  }

  const entry = index.entriesByPath.get(path);
  if (!entry) throw fail('FilesStaticError.NotFound', `File not found: ${path}`);
  return { entry };
};
