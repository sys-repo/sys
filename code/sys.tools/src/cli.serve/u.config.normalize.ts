import { type t, Is, getConfig } from './common.ts';

export async function normalize(input: t.ServeTool.Config | t.StringDir) {
  const config = Is.string(input) ? await getConfig(input) : input;

  normalizeDirs(config);

  /** Save if changed */
  if (config.fs.pending) await config.fs.save();
}

/**
 * Merge duplicate dirs inside a JsonFile<ConfigDoc>.
 */
function normalizeDirs(config: t.ServeTool.Config): void {
  const curr = config.current;
  const dirs = curr.dirs;
  if (!dirs || dirs.length <= 1) return;

  // Group by absolute dir path.
  const groups = new Map<string, t.ServeTool.DirConfig[]>();
  for (const d of dirs) {
    const list = groups.get(d.dir);
    if (list) list.push(d);
    else groups.set(d.dir, [d]);
  }

  // Nothing to do if no duplicates.
  if ([...groups.values()].every((g) => g.length === 1)) return;

  // Build the normalized array.
  const merged: t.ServeTool.DirConfig[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    const [first] = group;
    const contentTypes = Array.from(new Set(group.flatMap((x) => x.contentTypes)));
    const remoteBundles = Array.from(
      new Map(group.flatMap((x) => x.remoteBundles ?? []).map((b) => [b.local.dir, b])).values(),
    );

    merged.push({
      ...first,
      contentTypes,
      ...(remoteBundles.length > 0 ? { remoteBundles } : {}),
      modifiedAt: Date.now() as t.UnixTimestamp,
    });
  }

  // Write new dirs via immutable change().
  config.change((draft) => (draft.dirs = merged));
}
