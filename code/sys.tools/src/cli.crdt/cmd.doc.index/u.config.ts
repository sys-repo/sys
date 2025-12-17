import { type t } from '../common.ts';

export type DirIndexFilter = {
  includeExt?: string[];
  excludeExt?: string[];
};

/**
 * Canonical identity key for a directory index entry.
 * - If mount is empty/undefined: fall back to defaultMount.
 * - Otherwise join mount segments with '/'.
 */
export function dirEntryKey(e: t.CrdtTool.Config.DirIndexEntry, defaultMount: string): string {
  const m = e.mount ?? [];
  return m.length > 0 ? m.join('/') : defaultMount;
}

/**
 * Pure update: apply a filter to a specific entry identified by mountKey.
 * Returns the same array if no match found (no churn).
 */
export function applyDirEntryFilter(args: {
  dirs: t.CrdtTool.Config.DirIndexEntry[];
  mountKey: string;
  defaultMount: string;
  filter: DirIndexFilter;
  lastUsedAt?: t.UnixTimestamp;
}): t.CrdtTool.Config.DirIndexEntry[] {
  const { dirs, mountKey, defaultMount, filter } = args;

  let changed = false;
  const next = dirs.map((e) => {
    const key = dirEntryKey(e, defaultMount);
    if (key !== mountKey) return e;

    changed = true;
    const lastUsedAt = args.lastUsedAt ?? e.lastUsedAt;
    return { ...e, filter, lastUsedAt };
  });

  return changed ? next : dirs;
}
