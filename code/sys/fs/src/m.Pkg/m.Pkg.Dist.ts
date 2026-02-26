import type { PkgDistFsLib } from './t.ts';

import { Pkg } from '@sys/std/pkg';
import { pkg as typesPkg } from '@sys/types';
import { DirHash } from '../m.Dir.Hash/mod.ts';
import { pkg as fsPkg } from '../pkg.ts';

import { type t, Arr, CompositeHash, D, Delete, Err, Fs, JsrUrl, Path, Str, Time } from './common.ts';
import { Log } from './m.Log.ts';

/**
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export const Dist: PkgDistFsLib = {
  ...Pkg.Dist,
  Log,

  /**
   * Prepare and save a "distribution package" meta-data file `pkg.json`.
   */
  async compute(args) {
    const { save = false, filter, trustChildDist = false, onHashProgress } = args;
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
    const hash = exists
      ? await wrangle.hashes(dir, { filter, trustChildDist, onHashProgress })
      : { digest: '', parts: {} };
    const size: t.DistPkg['build']['size'] = {
      total: await wrangle.bytes(dir, Object.keys(hash.parts)),
      pkg: CompositeHash.size(hash.parts, (m) => Pkg.Dist.Is.codePath(m.path)) ?? 0,
    };

    const build: t.DistPkg['build'] = {
      time: Time.now.timestamp,
      size,
      builder: Pkg.toString(args.builder ?? Pkg.unknown()) as t.StringScopedPkgNameVer,
      runtime: `deno=${Deno.version.deno}:v8=${Deno.version.v8}:typescript=${Deno.version.typescript}`,
      hash: {
        // Version-pinned provenance for the hash policy used here.
        policy: JsrUrl.Pkg.file(fsPkg, D.hashPolicy.path),
      },
    };

    const dist: t.DistPkg = {
      type: JsrUrl.Pkg.file(typesPkg, 'src/types/t.Pkg.dist.ts'),
      pkg: args.pkg ?? Pkg.unknown(),
      build,
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
   * Load a `dist.json` file into a <DistPackage> type.
   */
  async load(dir) {
    dir = Fs.resolve(dir);
    const path = wrangle.filepath(dir);
    const exists = await Fs.exists(path);
    const errors = Err.errors();

    if (!exists) {
      errors.push(`File at path does not exist: ${path}`);
    }

    let kind: t.PkgDistLoadResponse['kind'] = exists ? 'invalid' : 'missing';
    let dist: t.DistPkg | undefined;
    let legacy: t.DistPkgLegacy | undefined;
    if (exists) {
      const loaded = (await Fs.readJson<unknown>(path)).data;
      if (Pkg.Is.dist(loaded)) {
        kind = 'canonical';
        dist = loaded;
      } else if (Pkg.Is.distCompat(loaded)) {
        kind = 'legacy';
        legacy = loaded;
      } else {
        errors.push(`The loaded file is not a valid DistPkg (canonical or legacy): ${path}`);
      }
    }

    // Finish up.
    const res: t.PkgDistLoadResponse = {
      exists,
      kind,
      path,
      dist,
      legacy,
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
      errors.push(`File at path does not exist: ${path}`);
    } else if (!dist) {
      errors.push(`Cannot verify non-canonical dist.json (${loaded.kind}): ${path}`);
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
  async hashes(
    path: t.StringDir,
    options: {
      filter?: (path: t.StringPath) => boolean;
      trustChildDist?: boolean;
      onHashProgress?: (e: t.DirHashComputeProgressEvent) => void | Promise<void>;
    } = {},
  ) {
    const { filter, trustChildDist = false, onHashProgress } = options;
    if (!trustChildDist) return await wrangle.hashesBase(path, filter, onHashProgress);

    const children = await wrangle.childDists(path);
    if (children.length === 0) return await wrangle.hashesBase(path, filter, onHashProgress);

    const childAbs = children.map((child) => Path.join(path, child.rootRel));
    const mergedFilter = (value: string) => {
      if (!wrangle.includeHashPart(value)) return false;
      const isChild = childAbs.some(
        (root) => value === root || value.startsWith(Path.join(root, '')),
      );
      if (isChild) return false;
      return filter ? filter(value) : true;
    };

    const res = await DirHash.compute(path, { filter: mergedFilter, onProgress: onHashProgress });
    const parts: t.DeepMutable<t.CompositeHashParts> = { ...res.hash.parts };

    /**
     * Merge child content hashes into the parent tree.
     *
     * NB:
     * We intentionally do not hash child dist metadata/signature artifacts into
     * the parent digest (`dist.json`, `dist.json.sig`). Child `dist.json`
     * includes volatile build metadata (for example timestamps), which would
     * make parent hashes churn across no-op rebuilds.
     */
    for (const child of children) {
      const { rootRel, dist } = child;
      for (const [childPath, uri] of Object.entries(dist.hash.parts)) {
        const rel = Str.trimLeadingDotSlash(childPath);
        const full = Path.join(rootRel, rel);
        parts[full] = uri;
      }
    }

    const outParts: t.CompositeHashParts = { ...parts };
    return { digest: CompositeHash.digest(outParts), parts: outParts };
  },

  async hashesBase(
    path: t.StringDir,
    filter?: (path: t.StringPath) => boolean,
    onHashProgress?: (e: t.DirHashComputeProgressEvent) => void | Promise<void>,
  ) {
    const mergedFilter = (value: string) => {
      if (!wrangle.includeHashPart(value)) return false;
      return filter ? filter(value) : true;
    };
    const res = await DirHash.compute(path, { filter: mergedFilter, onProgress: onHashProgress });
    return res.hash;
  },

  async childDists(path: t.StringDir) {
    const glob = Fs.glob(path, { includeDirs: false });
    const entries = await glob.find('**/dist.json');
    const roots = entries
      .map((entry) => Path.relative(path, entry.path))
      .map((rel) => Str.trimLeadingDotSlash(rel))
      .map((rel) => Path.dirname(rel))
      .map((rel) => Str.trimSlashes(rel))
      .filter((rel) => rel !== '.' && rel !== '');

    const unique = Arr.uniq(roots).sort((a, b) => a.length - b.length);
    const top: string[] = [];
    for (const root of unique) {
      if (!top.some((parent) => root === parent || root.startsWith(`${parent}/`))) {
        top.push(root);
      }
    }

    const children: Array<{ rootRel: string; dist: t.DistPkg }> = [];
    for (const rootRel of top) {
      const loaded = await Dist.load(Path.join(path, rootRel));
      if (Pkg.Is.dist(loaded.dist)) children.push({ rootRel, dist: loaded.dist });
    }
    return children;
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

  includeHashPart(path: t.StringPath) {
    const name = Path.basename(path);
    return name !== 'dist.json' && name !== 'dist.json.sig';
  },
} as const;
