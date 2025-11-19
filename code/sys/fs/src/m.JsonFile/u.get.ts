import { type t, Is, Time, Immutable, Fs, Obj } from './common.ts';

/**
 * Creates a generator function with a curried type and base options.
 */
export function getter<D extends t.JsonFileDoc>(
  args: t.JsonFileGetterArgs,
  initial: D | (() => D),
): t.JsonFileGetter<D> {
  return async (dir) => {
    const resolvedDir = Fs.resolve(dir);
    const path = Fs.join(resolvedDir, args.filename);
    return getOrCreate<D>(path, Is.func(initial) ? initial() : initial);
  };
}

/**
 * Get or create a config file handle.
 */
export async function getOrCreate<D extends t.JsonFileDoc>(
  path: t.StringPath,
  initial: D,
): Promise<t.JsonFile<D>> {
  type F = t.JsonFile<D>;

  path = Fs.resolve(path);
  const exists = await Fs.exists(path);
  const seed = await wrangle.seed<D>({ path, exists, initial });

  /**
   * Immutable handle:
   */
  const doc = Immutable.clonerRef(seed) as unknown as F;

  /**
   * Filesystem Methods:
   */
  const file: F['file'] = {
    get path() {
      return path;
    },
    async save() {
      const before = doc.current['.meta'].modifiedAt;
      doc.change((d) => (d['.meta'].modifiedAt = Time.now.timestamp));

      const { error } = await Fs.writeJson(path, doc.current);
      if (error) {
        // Revert change on error.
        doc.change((d) => (d['.meta'].modifiedAt = before));
      }

      return { error };
    },
  };

  // Extend the API.
  Object.defineProperty(doc, 'file', { get: () => file, enumerable: true, configurable: false });
  return doc as t.JsonFile<D>;
}

/**
 * Helpers:
 */
const wrangle = {
  async seed<D extends t.JsonFileDoc>(args: {
    path: string;
    exists: boolean;
    initial: D;
  }): Promise<D> {
    const { path, exists, initial } = args;

    // 1. No file on disk → start from initial.
    if (!exists) {
      return wrangle.ensureCreatedAt(initial);
    }

    // 2. File exists → read and validate.
    const res = await Fs.readJson<D>(path);

    if (!res.data) {
      // Corrupt or unreadable JSON. Fail explicitly instead of exploding
      // on a non-null assertion later.
      const error = res.error ?? new Error(`Failed to read config file at "${path}"`);
      throw error;
    }

    // 3. Normalise `.meta.createdAt` on the loaded doc.
    return wrangle.ensureCreatedAt(res.data);
  },

  ensureCreatedAt<D extends t.JsonFileDoc>(input: D): D {
    if (input['.meta'].createdAt) return input;

    const clone = Obj.clone(input);
    clone['.meta'].createdAt = Time.now.timestamp;
    return clone;
  },
} as const;
