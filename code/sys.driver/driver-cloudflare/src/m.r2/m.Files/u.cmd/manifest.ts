import { type t } from '../common.ts';
import { fail, provider } from '../u/error.ts';
import { page, validatePageInput } from '../u/page.ts';
import { listEntries, readIndex, type Runtime, urlRef } from '../u/runtime.ts';
import { objectKey, visiblePath } from '../u/path.ts';

/** Implementation of the `files:manifest` command for R2 Files backings. */
export async function manifest(
  runtime: Runtime,
  payload: t.Files.Cmd.Manifest.Payload,
): Promise<t.Files.Manifest> {
  const path = visiblePath(payload.path);
  if (!runtime.authority.allows('manifest', path)) {
    throw fail('FilesR2Error.PolicyDenied', `Manifest denied: ${path}`);
  }
  validatePageInput({
    kind: 'manifest',
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit: runtime.defaultLimit,
  });

  return await provider({
    action: 'Manifest',
    path,
    async run() {
      const index = await readIndex(runtime);
      const entries = listEntries(runtime, index, {
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
        defaultLimit: runtime.defaultLimit,
      });

      return {
        '.meta': {
          version: 'sys.files.manifest:v1',
          capabilities: runtime.capabilities,
          ...(res.cursor === undefined && res.truncated === undefined ? {} : {
            page: {
              ...(res.cursor === undefined ? {} : { cursor: res.cursor }),
              ...(res.truncated === undefined ? {} : { truncated: res.truncated }),
            },
          }),
        },
        entries: res.items,
        ...(payload.contentRefs === true
          ? { contentRefs: await contentRefs(runtime, res.items) }
          : {}),
      };
    },
  });
}

async function contentRefs(
  runtime: Runtime,
  entries: readonly t.Files.Entry[],
): Promise<readonly t.Files.ContentRef[]> {
  const refs: t.Files.ContentRef.Url[] = [];
  for (const entry of entries) {
    if (entry.kind !== 'file') continue;
    if (!runtime.authority.allows('read', entry.path)) continue;
    const stat = await runtime.bucket.stat(objectKey(runtime.prefix, entry.path));
    if (!stat) continue;
    const file = stat.metadata?.mediaType === undefined
      ? entry
      : { ...entry, mediaType: stat.metadata.mediaType };
    const ref = urlRef(runtime, entry.path, file);
    if (ref) refs.push(ref);
  }
  return refs;
}
