import { Pkg } from '@sys/std/pkg';
import { type t, Delete, Err, Fs, Hash } from './common.ts';

export const Dist: t.PkgDistLib = {
  /**
   * Prepare and save a "distribution package"
   * meta-data file, `dist.json`.
   */
  async compute(args) {
    const { dir, entry = '', save = false } = args;
    const pkg = args.pkg ?? Pkg.unknown();
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
    const bytes = await wrangle.bytes(dir, Object.keys(hash.files));
    const size: t.DistPkg['size'] = { bytes };
    const dist: t.DistPkg = { pkg, size, entry, hash };

    /**
     * Prepare response.
     */
    const ok = exists && !error;
    const res = Delete.undefined<t.PkgSaveDistResponse>({ ok, dir, exists, dist, error });

    /**
     * Save to the file-system.
     */
    if (ok && save) {
      const path = Fs.join(dir, 'dist.json');
      const json = `${JSON.stringify(dist, null, '  ')}\n`;
      await Fs.ensureDir(dir);
      await Deno.writeTextFile(path, json);
    }

    // Finish up.
    return res;
  },
};

/**
 * Helpers
 */
const wrangle = {
  async hashes(path: t.StringDir) {
    const filter = (path: string) => path !== './dist.json';
    const { hash, files } = await Hash.Dir.compute(path, { filter });
    const res: t.DistPkgHashes = { pkg: hash, files };
    return res;
  },

  async bytes(dir: t.StringDir, files: t.StringFile[]) {
    let count = 0;
    for (const file of files) {
      const stat = await Fs.stat(Fs.join(dir, file));
      count += stat.size;
    }
    return count;
  },
} as const;
