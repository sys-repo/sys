import { CompositeHash, Err, Fs, Hash, Path, type t } from './common.ts';

/**
 * Verify a directory against a composite hash or hash file.
 */
export const verify: t.Dir.Hash.Verify.Method = async (dir, hashInput) => {
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
      hash = file.data?.hash;
      if (!Hash.Is.composite(hash)) {
        errors.push(`File does not contain a { hash: <CompositeHash> } structure: ${path}`);
      }
    }
  }

  /**
   * Verify.
   */
  let is: t.CompositeHash.Verify.Response['is'] = { valid: undefined };
  if (Hash.Is.composite(hash)) {
    const verify = await CompositeHash.verify(hash, async (e) => {
      const path = Fs.join(dir, e.part);
      return (await Fs.read(path)).data;
    });
    is = verify.is;
    if (verify.error) errors.push(verify.error);
  }

  // Finish up.
  return { exists, dir, hash: wrangle.hash(hash), is, error: errors.toError() };
};

/**
 * Helpers
 */
const wrangle = {
  hash(input?: t.CompositeHash) {
    const hash = input ?? CompositeHash.toComposite();
    return CompositeHash.toComposite(hash);
  },
} as const;
