import { c, Cli, EXCLUDE, Fs, Path, Time, type t } from '../common.ts';
import { applyDirEntryFilter, dirEntryKey, type DirIndexFilter } from './u.config.ts';

export type MenuFilter = {
  includeExt: string[];
};

export type ExtCounts = { readonly [ext: string]: number };

/**
 * Read the currently saved filter (for a mount) from a document entry.
 * Normalizes extensions (lower-case, no '.', unique, sorted).
 */
export function getExistingFilter(args: {
  doc: t.CrdtTool.Config.DocumentEntry;
  mountKey: string;
  defaultMount: t.StringPath;
}): MenuFilter {
  const { doc, mountKey, defaultMount } = args;
  const dirs = doc.indexes?.['fs:dirs']?.dirs ?? [];
  const hit = dirs.find((e) => dirEntryKey(e, defaultMount) === mountKey);
  const includeExt = normalizeExts(hit?.filter?.includeExt ?? []);
  return { includeExt };
}

/**
 * Normalize a single extension string.
 * - lower-case
 * - strip leading '.'
 * - trim
 */
export function normalizeExt(input: string): string {
  const s = input.trim();
  const raw = s.startsWith('.') ? s.slice(1) : s;
  return raw.trim().toLowerCase();
}

/**
 * Normalize an extension list:
 * - lower-case
 * - strip leading '.'
 * - remove empties
 * - unique + sorted
 */
export function normalizeExts(input: readonly string[]): string[] {
  const uniq = new Set(input.map(normalizeExt).filter((s) => s.length > 0));
  return Array.from(uniq).sort();
}

/**
 * Convert a list of extensions into a set (normalized).
 * Used for checkbox preselection.
 */
export function toCheckedSet(input: readonly string[]): Set<string> {
  return new Set(normalizeExts(input));
}

/**
 * Scan a directory and return extension counts.
 * Keys are normalized extensions (no '.', lower-case).
 */
export async function scanDirExtensionCounts(dir: t.StringDir): Promise<ExtCounts> {
  const glob = Fs.glob(dir, { includeDirs: false, exclude: EXCLUDE });
  const paths = (await glob.find('**')).map((p) => p.path);

  const counts: Record<string, number> = {};
  for (const p of paths) {
    const ext = normalizeExt(Path.extname(p));
    if (!ext) continue;
    counts[ext] = (counts[ext] ?? 0) + 1;
  }

  return counts;
}

/**
 * Scan a directory and return candidate extensions for filtering.
 * Output is normalized (keys from `scanDirExtensionCounts`).
 */
export async function scanDirExtensions(dir: t.StringDir): Promise<string[]> {
  const counts = await scanDirExtensionCounts(dir);
  return Object.keys(counts).sort();
}

/**
 * Prompt user to select extensions, preselecting any already saved.
 * Returns normalized `includeExt`.
 */
export async function promptExtensionFilter(args: {
  counts: ExtCounts;
  checked: Set<string>;
}): Promise<string[]> {
  const { counts, checked } = args;

  const exts = Object.keys(counts).sort();
  const selection = await Cli.Input.Checkbox.prompt({
    message: 'Include file types (ext):\n',
    options: exts.map((ext) => {
      const n = counts[ext] ?? 0;
      return {
        name: `.${ext} ${c.dim(`(${n})`)}`,
        value: ext,
        checked: checked.has(ext),
      };
    }),
  });

  return normalizeExts(selection ?? []);
}

/**
 * Pure update: apply the menu filter to the matching dir-entry and bump `lastUsedAt`.
 * Returns the same array if nothing changed.
 */
export function applyMenuFilterToDirs(args: {
  dirs: t.CrdtTool.Config.DirIndexEntry[];
  mountKey: string;
  defaultMount: t.StringPath;
  filter: DirIndexFilter;
  now?: t.UnixTimestamp;
}): t.CrdtTool.Config.DirIndexEntry[] {
  const { dirs, mountKey, defaultMount, filter } = args;
  const lastUsedAt = args.now ?? Time.now.timestamp;
  return applyDirEntryFilter({ dirs, mountKey, defaultMount, filter, lastUsedAt });
}
