import { type t, Fs, Immutable, Obj, Time } from './common.ts';

/**
 * Get or create a file handle.
 */
export async function get<D extends t.JsonFileDoc>(
  path: t.StringPath,
  initial: D,
  options: t.JsonFileGetOptions = {},
): Promise<t.JsonFile<D>> {
  type F = t.JsonFile<D>;

  path = Fs.resolve(path);
  const exists = await Fs.exists(path);
  const seed = await wrangle.seed<D>({ path, exists, initial });

  /**
   * Immutable handle:
   */
  let savePending = !exists; // brand-new file starts "dirty"
  let changeVersion = 0;

  const doc = Immutable.clonerRef(seed) as unknown as F;
  doc.events().$.subscribe(() => {
    changeVersion += 1;
    savePending = true;
  });

  async function save() {
    const before = doc.current['.meta'].modifiedAt;

    // Apply our own change; this will bump changeVersion via events().
    doc.change((d) => (d['.meta'].modifiedAt = Time.now.timestamp));

    // Snapshot the version after our change.
    const versionAtSaveStart = changeVersion;

    const { error } = await Fs.writeJson(path, doc.current);
    if (error) {
      // Revert change on error.
      doc.change((d) => (d['.meta'].modifiedAt = before));
      return { error };
    }

    // Only clear pending if nothing else changed during the save.
    if (changeVersion === versionAtSaveStart) {
      savePending = false;
    }

    return { error };
  }

  const file: F['fs'] = {
    save,
    get path() {
      return path;
    },
    get savePending() {
      return savePending;
    },
  };

  Object.defineProperty(doc, 'fs', { get: () => file, enumerable: true, configurable: false });

  // If this is a brand-new file and the caller requested `touch`,
  // synchronise the initial state to disk immediately and start clean.
  if (!exists && options.touch) {
    await file.save();
  }

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
      const error = res.error ?? new Error(`Failed to read file at "${path}"`);
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
