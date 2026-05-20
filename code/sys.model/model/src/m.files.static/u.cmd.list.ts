import { page, validatePageInput } from '../m.files/u.page.ts';
import { type t } from './common.ts';
import { invalidPath } from './u.error.ts';
import type { StaticIndex } from './u.index.ts';
import { listEntries } from './u.listEntries.ts';
import { visiblePath } from './u.path.ts';

/** Implementation of the `files:list` command for static dist metadata. */
export const list = (
  index: StaticIndex,
  policy: t.FilesPolicy.Shape,
  payload: t.FilesCmd.List.Payload,
  defaultLimit: t.Files.Limit,
): t.FilesCmd.List.Result => {
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
