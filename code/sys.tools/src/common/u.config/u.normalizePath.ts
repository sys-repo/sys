import { type t, Fs, JsonFile } from './common.ts';
import { getPath } from './u.path.ts';

/**
 * Normalize config file location.
 *
 * If the canonical path does not exist but a legacy root-level
 * file does, migrate it once. Best-effort only.
 */
export async function normalizePath(cwd: t.StringDir, filename: string): Promise<void> {
  const canonical = getPath(cwd, filename);
  if (await Fs.exists(canonical)) return;

  const rootLevel = getPath(cwd, filename, { subdir: '' });

  // Guard against accidental self-move
  if (rootLevel === canonical) return;
  if (!(await Fs.exists(rootLevel))) return;

  try {
    // Policy: never overwrite canonical
    if (!(await Fs.exists(canonical))) {
      await Fs.move(rootLevel, canonical);
    }
  } catch {
    // Best-effort only — normalization must never block load
  }
}
