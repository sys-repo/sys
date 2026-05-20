import { page, validatePageInput } from '../../m.files/u.page.ts';
import { type t } from '../common.ts';
import { assertPayload } from './u.cmd.payload.ts';
import { listEntries } from '../u.listEntries.ts';
import { type MemoryNodes } from '../u.index.ts';
import { invalidPath, visiblePath } from '../u.path.ts';

/** Implementation of the `files:list` command for memory nodes. */
export const list = (
  nodes: MemoryNodes,
  policy: t.FilesPolicy.Shape,
  payload: t.FilesCmd.List.Payload,
  defaultLimit: t.Files.Limit,
): t.FilesCmd.List.Result => {
  assertPayload(payload, 'list');
  const path = visiblePath(payload.path);
  validatePageInput({
    kind: 'list',
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit,
  }, invalidPath);

  const entries = listEntries(nodes, policy, {
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
