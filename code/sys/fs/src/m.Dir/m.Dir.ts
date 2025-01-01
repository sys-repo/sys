import { type t, Fs, Time, slug, Path, Err } from './common.ts';

/**
 * Helpers for working with file-system directories.
 */
export const Dir: t.FsDirLib = {
  /**
   * Create a snapshot of the specified directory.
   */
  async snapshot(source, target) {
    const errors = Err.errors();
    const timestamp = Time.now.timestamp;
    const id = `${timestamp}.${slug()}`;

    const path: t.DirSnapshot['path'] = {
      source,
      target: Path.join(target, id),
    };

    const copyRes = await Fs.copyDir(path.source, path.target);
    if (copyRes.error) errors.push(copyRes.error);

    const res: t.DirSnapshot = {
      id,
      timestamp,
      path,
      error: errors.toError(),
    };
    return res;
  },
};
