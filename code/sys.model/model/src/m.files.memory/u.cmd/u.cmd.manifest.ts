import { manifestMeta, pageMeta } from '../../m.files/u/u.manifest.ts';
import { page, validatePageInput } from '../../m.files/u/u.page.ts';
import { type t } from '../common.ts';
import { assertPayload } from './u.cmd.payload.ts';
import { fail } from '../u/u.error.ts';
import { type MemoryNodes } from '../u/u.index.ts';
import { listEntries } from '../u/u.listEntries.ts';
import { invalidPath, visiblePath } from '../u/u.path.ts';
import { manifestAllowed } from '../u/u.policy.ts';

/** Implementation of the `files:manifest` command for memory nodes. */
export const manifest = (
  nodes: MemoryNodes,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Manifest.Payload,
  capabilities: t.Files.Capabilities,
  defaultLimit: t.Files.Limit,
): t.Files.Manifest => {
  assertPayload(payload, 'manifest');
  const path = visiblePath(payload.path);
  if (!manifestAllowed(policy, path)) {
    throw fail('FilesMemoryError.PolicyDenied', `Manifest denied: ${path}`);
  }
  validatePageInput({
    kind: 'manifest',
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
    kind: 'manifest',
    items: entries,
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit,
  }, invalidPath);

  return {
    '.meta': manifestMeta({ capabilities, page: pageMeta(res) }),
    entries: res.items,
  };
};
