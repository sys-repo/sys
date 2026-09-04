import { type t, Fs, JsonFile } from './common.ts';
import { getPath } from './u.path.ts';
import { normalizePath } from './u.normalizePath.ts';

/**
 * Load the config file from the canonical location.
 */
export async function get<Doc extends t.JsonFile.Doc>(
  cwd: t.StringDir,
  filename: string,
  initial: Doc,
): Promise<t.JsonFile.Instance<Doc>> {
  const path = getPath(cwd, filename);
  await Fs.ensureDir(Fs.dirname(path));
  await normalizePath(cwd, filename);
  return JsonFile.Singleton.get<Doc>(path, initial, { touch: true });
}
