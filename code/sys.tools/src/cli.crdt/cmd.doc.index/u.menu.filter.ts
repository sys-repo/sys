import { Cli, Fs, Path, Time, type t } from '../common.ts';
import { applyDirEntryFilter, dirEntryKey, type DirIndexFilter } from './u.config.ts';

export type MenuFilter = {
  includeExt: string[];
};

/**
 * Read the currently saved filter (for a mount) from a document entry.
 * Normalizes extensions (lower-case, no '.', unique, sorted).
 */
export function getExistingFilter(args: {
  doc: t.CrdtTool.Config.DocumentEntry;
  mountKey: string;
  defaultMount: string;
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
 *
 * Examples:
 * - ".TS" → "ts"
 * - "ts"  → "ts"
 * - ""    → ""
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
 * Scan a directory and return candidate extensions for filtering.
 * Output is normalized (see `normalizeExts`).
 */
export async function scanDirExtensions(dir: t.StringDir): Promise<string[]> {
  const glob = Fs.glob(dir, { includeDirs: false });
  const paths = (await glob.find('**')).map((p) => p.path);

  const list = new Set(
    paths
      .map((p) => Path.extname(p))
      .map(normalizeExt)
      .filter((e) => e.length > 0),
  );

  return Array.from(list).sort();
}

/**
 * Prompt user to select extensions, preselecting any already saved.
 * Returns normalized `includeExt`.
 */
export async function promptExtensionFilter(args: {
  exts: string[];
  checked: Set<string>;
}): Promise<string[]> {
  const { exts, checked } = args;

  const selection = await Cli.Input.Checkbox.prompt({
    message: 'Filter on:',
    options: exts.map((value) => ({
      name: `.${value}`,
      value,
      checked: checked.has(value),
    })),
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
  defaultMount: string;
  filter: DirIndexFilter;
  now?: t.UnixTimestamp;
}): t.CrdtTool.Config.DirIndexEntry[] {
  const { dirs, mountKey, defaultMount, filter } = args;
  const lastUsedAt = args.now ?? Time.now.timestamp;
  return applyDirEntryFilter({ dirs, mountKey, defaultMount, filter, lastUsedAt });
}
