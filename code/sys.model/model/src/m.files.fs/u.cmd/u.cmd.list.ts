import { type t } from '../common.ts';
import { listEntries } from '../u/u.listEntries.ts';
import { page, validatePageInput } from '../u/u.page.ts';
import { type Scope, visiblePath } from '../u/u.path.ts';

/**
 * Implementation of the `files:list` command.
 */
export const list = async (
  scope: Scope,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.List.Payload,
  defaultLimit: t.Files.Limit,
): Promise<t.Files.Cmd.List.Result> => {
  const path = visiblePath(scope.fs, payload.path);
  validatePageInput({
    kind: 'list',
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
    kind: 'list',
    items: entries,
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit,
  });
  return {
    entries: res.items,
    ...(res.cursor === undefined ? {} : { cursor: res.cursor }),
    ...(res.truncated === undefined ? {} : { truncated: res.truncated }),
  };
};
