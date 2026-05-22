import { type t } from '../common.ts';
import { type ListEntriesOptions, snapshotListOptions } from '../../m.files/u/u.list.ts';
import { realDirectory } from '../u/u.dir.ts';
import { fail } from '../u/u.error.ts';
import { allowed } from '../u/u.policy.ts';
import { type Scope, visiblePath } from '../u/u.path.ts';

export type WatchScope = Scope<t.FilesFs.Capability.Live>;

export type WatchQuery = ListEntriesOptions & {
  readonly real: t.StringAbsolutePath;
  readonly scope: WatchScope;
};

const invalidPath = (message: string): Error => fail('FilesFsError.InvalidPath', message);

/** Snapshot and validate a live files/fs watch query. */
export const watchQuery = async (
  scope: WatchScope,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Watch.Payload,
): Promise<WatchQuery> => {
  const path = visiblePath(scope.fs, payload.path);
  const query = snapshotListOptions(
    {
      path,
      match: payload.match,
      exclude: payload.exclude,
    },
    invalidPath,
  );

  if (!allowed(policy, 'watch', query.path)) {
    throw fail('FilesFsError.PolicyDenied', `Watch denied: ${query.path}`);
  }

  const dir = await realDirectory(scope, query.path);
  return { ...query, real: dir.real, scope: dir.scope };
};
