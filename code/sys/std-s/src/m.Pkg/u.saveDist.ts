import { type t, Delete, Err, Fs, Hash } from './common.ts';

/**
 * Prepare and save a "distribution package"
 * meta-data file, `dist.json`.
 */
export const saveDist: t.PkgSLib['saveDist'] = async (args) => {
  const { dir, pkg, entry = '', dryRun = false } = args;
  let error: t.StdError | undefined;

  const exists = await Fs.exists(dir);
  if (!exists) {
    const message = `The given "dist" directory for the package does not exist: ${dir}`;
    error = Err.std(message);
  } else {
    const isDir = await Fs.Is.dir(dir);
    if (!isDir) {
      const message = `The given "dist" path is not a directory: ${dir}`;
      error = Err.std(message);
    }
  }

  /**
   * Prepare the "distributeion-package" json.
   */
  const hash = exists ? await wrangle.hashes(dir) : { pkg: '', files: {} };
  const dist: t.DistPkg = { pkg, entry, hash };

  /**
   * Prepare response.
   */
  const ok = exists && !error;
  const res = Delete.undefined<t.PkgSaveDistResponse>({ ok, dir, exists, dist, error });

  /**
   * Save to the file-system.
   */
  if (!dryRun && ok) {
    const path = Fs.join(dir, 'dist.json');
    const json = `${JSON.stringify(dist, null, '  ')}\n`;
    await Fs.ensureDir(dir);
    await Deno.writeTextFile(path, json);
  }

  // Finish up.
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async hashes(path: t.StringDirPath) {
    const filter = (path: string) => path !== './dist.json';
    const { hash, files } = await Hash.Dir.compute(path, { filter });
    const res: t.DistPkgHashes = { pkg: hash, files };
    return res;
  },
} as const;
