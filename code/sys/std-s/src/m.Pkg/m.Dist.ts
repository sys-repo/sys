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
    const res = Delete.undefined<t.PkgSaveDistResponse>({ dir, exists, dist, error });

    /**
     * Save to the file-system.
     */
    if (save && exists && !error) {
      const path = Fs.join(dir, 'dist.json');
      const json = `${JSON.stringify(dist, null, '  ')}\n`;
      await Fs.ensureDir(dir);
      await Deno.writeTextFile(path, json);
    }

    // Finish up.
    return res;
  },

  /**
   * Load a `dist.json` file into a \<DistPackage\> type.
   */
  async load(path) {
    path = wrangle.filepath(path);
    const exists = await Fs.exists(path);
    const errors = Err.errors();

    if (!exists) {
      errors.add(`File at path does not exist: ${path}`);
    }

    let dist: t.DistPkg | undefined;
    if (exists) {
      const res = await Fs.readJson<t.DistPkg>(path);
      dist = res.json;
    }

    // Finish up.
    const res: t.PkgLoadDistResponse = {
      exists,
      path,
      dist,
      error: errors.toError('Several errors occured while loading the `dist.json`'),
    };
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

  filepath(path: t.StringPath) {
    if (!path.endsWith('/dist.json')) path = Fs.join(path, 'dist.json');
    return path;
  },
} as const;
