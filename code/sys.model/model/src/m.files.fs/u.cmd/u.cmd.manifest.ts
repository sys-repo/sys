import { type t } from '../common.ts';
import { listEntries } from '../u/u.listEntries.ts';
import { page, validatePageInput } from '../u/u.page.ts';
import { fail } from '../u/u.error.ts';
import { manifestAllowed } from '../u/u.policy.ts';
import { type Scope, visiblePath } from '../u/u.path.ts';

/**
 * Implementation of the `files:manifest` command.
 */
export const manifest = async (
  scope: Scope,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Manifest.Payload,
  capabilities: t.Files.Capabilities,
  defaultLimit: t.Files.Limit,
): Promise<t.Files.Manifest> => {
  const path = visiblePath(scope.fs, payload.path);
  if (!manifestAllowed(policy, path)) {
    throw fail('FilesFsError.PolicyDenied', `Manifest denied: ${path}`);
  }
  validatePageInput({
    kind: 'manifest',
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit,
  });

  const entries = await listEntries(scope, policy, {
    path,
    depth: payload.depth,
    match: payload.match,
    exclude: payload.exclude,
  });
  const res = page({
    kind: 'manifest',
    items: entries,
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit,
  });

  return {
    version: 'sys.files.manifest:v1',
    capabilities,
    entries: res.items,
    ...(res.cursor === undefined ? {} : { cursor: res.cursor }),
    ...(res.truncated === undefined ? {} : { truncated: res.truncated }),
  };
};
