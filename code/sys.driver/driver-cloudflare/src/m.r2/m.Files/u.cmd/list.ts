import { type t } from '../common.ts';
import { provider } from '../u/error.ts';
import { page, validatePageInput } from '../u/page.ts';
import { listEntries, readIndex, type Runtime } from '../u/runtime.ts';
import { visiblePath } from '../u/path.ts';

/** Implementation of the `files:list` command for R2 Files backings. */
export async function list(
  runtime: Runtime,
  payload: t.Files.Cmd.List.Payload,
): Promise<t.Files.Cmd.List.Result> {
  const path = visiblePath(payload.path);
  validatePageInput({
    kind: 'list',
    cursor: payload.cursor,
    limit: payload.limit,
    defaultLimit: runtime.defaultLimit,
  });

  return await provider({
    action: 'List',
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
        kind: 'list',
        items: entries,
        cursor: payload.cursor,
        limit: payload.limit,
        defaultLimit: runtime.defaultLimit,
      });

      return {
        entries: res.items,
        ...(res.cursor === undefined ? {} : { cursor: res.cursor }),
        ...(res.truncated === undefined ? {} : { truncated: res.truncated }),
      };
    },
  });
}
