import { page, validatePageInput } from '../../m.files/u/u.page.ts';
import { type t } from '../common.ts';
import { invalidPath } from '../u/u.error.ts';
import type { StaticIndex } from '../u/u.index.ts';
import { listEntries } from '../u/u.listEntries.ts';
import { visiblePath } from '../u/u.path.ts';

/** Implementation of the `files:list` command for static dist metadata. */
export const list = (
  index: StaticIndex,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.List.Payload,
  defaultLimit: t.Files.Limit,
): t.Files.Cmd.List.Result => {
  const path = visiblePath(payload.path);
  validatePageInput({
    kind: 'list',
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit,
  }, invalidPath);
  const entries = listEntries(index, policy, {
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
  }, invalidPath);
  return {
    entries: res.items,
    ...(res.cursor === undefined ? {} : { cursor: res.cursor }),
    ...(res.truncated === undefined ? {} : { truncated: res.truncated }),
  };
};
