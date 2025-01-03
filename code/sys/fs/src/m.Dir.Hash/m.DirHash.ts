import { Hash } from '@sys/std/hash';
import { type t, Err, Fs, Path } from './common.ts';

export const DirHash: t.HashDirLib = {
  /**
   * Computer a `CompositeHash` for the given directory.
   */
  async compute(dir, options = {}) {
    dir = Fs.resolve(dir);
    const { filter } = wrangle.computeOptions(options);
    const errors = Err.errors();
    const exists = await Fs.exists(dir);
    const builder = Hash.composite();
    const res: t.HashDir = { exists, dir, hash: builder.toObject() };

    if (!exists) {
      errors.push(Err.std('Directory does not exist.'));
    } else {
      const isDir = await Fs.Is.dir(dir);
      if (!isDir) {
        errors.push(Err.std('Path is not a directory.'));
      } else {
        const paths = (await Fs.glob(dir).find('**'))
          .filter((m) => m.isFile)
          .map((m) => m.path.substring(dir.length + 1))
          .filter((m) => (filter ? filter(m) : true));
        for (const path of paths) {
          const filepath = Fs.join(dir, path);
          const exists = await Fs.exists(filepath);
          if (exists) builder.add(path, await Deno.readFile(filepath));
        }
        res.hash = builder.toObject();
      }
    }

    res.error = errors.toError();
    return res;
  },

  /**
   * Verify a directory against the given [CompositeHash] value.
   */
  async verify(dir, hashInput) {
    dir = Fs.resolve(dir);
    const errors = Err.errors();
    const exists = await Fs.exists(dir);
    if (!exists) {
      errors.push(`The given directory to verify does not exist. ${dir}`);
    }

    let hash: t.CompositeHash | undefined;
    if (Hash.Is.composite(hashInput)) hash = hashInput;

    /**
     * Load {Hash} from path.
     */
    if (exists && typeof hashInput === 'string') {
      const path = Path.Is.absolute(hashInput) ? hashInput : Path.join(dir, hashInput);
      const file = await Fs.readJson<{ hash: t.CompositeHash }>(path);
      if (!file.exists) {
        errors.push(`Hash data to compare does not exist in a file at specified path: ${path}`);
      } else {
        hash = file.json?.hash;
        if (!Hash.Is.composite(hash)) {
          errors.push(`File does not contain a { hash: <CompositeHash> } structure: ${path}`);
        }
      }
    }

    /**
     * Response.
     */
    const res: t.HashDirVerifyResponse = {
      exists,
      dir,
      hash: wrangle.hash(hash),
      is: { valid: undefined },
    };

    /**
     * Verify.
     */
    if (Hash.Is.composite(hash)) {
      const read = Deno.readFile;
      const verification = await Hash.Composite.verify(hash, async (e) => {
        const path = Fs.join(dir, e.part);
        const exists = await Fs.exists(path);
        return exists ? read(path) : undefined;
      });
      res.is = verification.is;
      if (verification.error) errors.push(verification.error);
    }

    // Finish up.
    res.error = errors.toError();
    return res;
  },
};

/**
 * Helpers
 */
const wrangle = {
  computeOptions(input?: t.HashDirComputeOptions | t.HashDirFilter) {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },

  hash(input?: t.CompositeHash) {
    const hash = input ?? Hash.Composite.toComposite();
    return Hash.Composite.toComposite(hash);
  },
} as const;
