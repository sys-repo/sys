import { manifestMeta, pageMeta } from '../../m.files/u/u.manifest.ts';
import { page, validatePageInput } from '../../m.files/u/u.page.ts';
import { allowed, manifestAllowed } from '../../m.files/u/u.policy.ts';
import { type t } from '../common.ts';
import { fail, invalidPath } from '../u/u.error.ts';
import type { StaticIndex } from '../u/u.index.ts';
import { listEntries } from '../u/u.listEntries.ts';
import { visiblePath } from '../u/u.path.ts';

/** Implementation of the `files:manifest` command for static dist metadata. */
export const manifest = (
  index: StaticIndex,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Manifest.Payload,
  capabilities: t.Files.Capabilities,
  defaultLimit: t.Files.Limit,
): t.Files.Manifest => {
  const path = visiblePath(payload.path);
  if (!manifestAllowed(policy, path)) {
    throw fail('FilesStaticError.PolicyDenied', `Manifest denied: ${path}`);
  }
  validatePageInput({
    kind: 'manifest',
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
    kind: 'manifest',
    items: entries,
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit,
  }, invalidPath);

  return {
    '.meta': manifestMeta({
      capabilities,
      page: pageMeta(res),
      ...(index.distBuildTime === undefined
        ? {}
        : { dist: { build: { time: index.distBuildTime } } }),
    }),
    entries: res.items,
    ...(payload.content === true ? { content: contentRefs(index, policy, res.items) } : {}),
  };
};

function contentRefs(
  index: StaticIndex,
  policy: t.Files.Policy.Shape,
  entries: readonly t.Files.Entry[],
): readonly t.Files.ContentRef[] {
  return entries
    .filter((entry): entry is t.Files.Entry.File => entry.kind === 'file')
    .filter((entry) => allowed(policy, 'read', entry.path))
    .map((entry) => index.filesByPath.get(entry.path)?.contentRef)
    .filter((ref): ref is t.Files.ContentRef => ref !== undefined);
}
