import { Pkg } from '@sys/std/pkg';
import { DirHash } from '../m.Dir.Hash/mod.ts';
import { type t, Delete, Err, Fs, Path } from './common.ts';

/**
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export const Dist: t.PkgDistFsLib = {
  ...Pkg.Dist,

  async compute(input) {
    const args = wrangle.computeArgs(input);
    const { entry = '', save = false } = args;
    const dir = Fs.resolve(args.dir);
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
    const hash = exists ? await wrangle.hashes(dir) : { digest: '', parts: {} };
    const bytes = await wrangle.bytes(dir, Object.keys(hash.parts));
    const size: t.DistPkg['size'] = { bytes };
    const dist: t.DistPkg = {
      '-type:': '@sys/types:DistPkg',
      pkg,
      size,
      entry: wrangle.entry(entry),
      hash,
    };

    /**
     * Prepare response.
     */
    const res = Delete.undefined<t.PkgDistComputeResponse>({ dir, exists, dist, error });

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
  async load(dir) {
    dir = Fs.resolve(dir);
    const path = wrangle.filepath(dir);
    const exists = await Fs.exists(path);
    const errors = Err.errors();

    if (!exists) {
      errors.push(`File at path does not exist: ${path}`);
    }

    let dist: t.DistPkg | undefined;
    if (exists) {
      dist = (await Fs.readJson<t.DistPkg>(path)).data;
    }

    // Finish up.
    const res: t.PkgDistLoadResponse = {
      exists,
      path,
      dist,
      error: errors.toError('Several errors occured while loading the `dist.json`'),
    };
    return res;
  },

  /**
   * Verify a folder with hash definitions of the distribution-package.
   */
  async verify(dir, hash) {
    dir = Fs.resolve(dir);
    const errors = Err.errors();
    const loaded = await Dist.load(dir);
    const { path, dist, exists } = loaded;
    if (!exists) {
      errors.push(loaded.error);
    }

    const res: t.PkgDistVerifyResponse = {
      exists,
      dist,
      is: { valid: undefined },
      error: errors.toError(),
    };

    /**
     * Perform the validation checks.
     */
    if (exists && dist) {
      const dir = Fs.dirname(path);
      const distfile = Fs.join(dir, 'dist.json');
      const verification = await DirHash.verify(dir, hash ?? distfile);
      res.is = verification.is;
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
    const res = await DirHash.compute(path, { filter });
    return res.hash;
  },

  async bytes(dir: t.StringDir, files: t.StringFile[]) {
    let count = 0;
    for (const file of files) {
      const stat = await Fs.stat(Fs.join(dir, file));
      count += stat?.size ?? 0;
    }
    return count;
  },

  filepath(path: t.StringPath) {
    if (!path.endsWith('/dist.json')) path = Fs.join(path, 'dist.json');
    return path;
  },

  computeArgs(input: Parameters<t.PkgDistFsLib['compute']>[0]): t.PkgDistComputeArgs {
    if (typeof input === 'string') return { dir: input };
    return input;
  },

  entry(input: string) {
    input = Path.normalize(input);
    return input === '.' ? '' : input;
  },
} as const;
