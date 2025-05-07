import { Pkg } from '@sys/std/pkg';
import { pkg as typesPkg } from '@sys/types';
import { DirHash } from '../m.Dir.Hash/mod.ts';
import { type t, CompositeHash, Delete, Err, Fs, JsrUrl, Path, Time } from './common.ts';

/**
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export const Dist: t.PkgDistFsLib = {
  ...Pkg.Dist,

  async compute(args) {
    const { entry = '', save = false } = args;
    const dir = Fs.resolve(args.dir);
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
     * Prepare the "distribution-package" json.
     */
    const hash = exists ? await wrangle.hashes(dir) : { digest: '', parts: {} };
    const size: t.DistPkg['build']['size'] = {
      total: await wrangle.bytes(dir, Object.keys(hash.parts)),
      pkg: CompositeHash.size(hash.parts, (m) => m.path.startsWith('pkg/')) ?? 0,
    };

    const build: t.DistPkg['build'] = {
      time: Time.now.timestamp,
      size,
      builder: args.builder ?? Pkg.unknown(),
      runtime: `deno=${Deno.version.deno}:v8=${Deno.version.v8}:typescript=${Deno.version.typescript}`,
    };

    const dist: t.DistPkg = {
      type: JsrUrl.Pkg.file(typesPkg, 'src/types/t.Pkg.dist.ts'),
      pkg: args.pkg ?? Pkg.unknown(),
      build,
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

  entry(input: string) {
    input = Path.normalize(input);
    return input === '.' ? '' : input;
  },
} as const;
