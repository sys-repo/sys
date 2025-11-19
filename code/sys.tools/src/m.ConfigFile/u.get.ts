import { type t, Is, Time, Immutable, Fs } from './common.ts';

/**
 * Creates a generator function with a curried type and base options.
 */
export function getter<D extends t.ConfigFileDoc>(
  initial: D | (() => D),
  opts: t.ConfigFileGetOptions = {},
): t.ConfigFileGetter<D> {
  return async (dir) => getOrCreate<D>(dir, Is.func(initial) ? initial() : initial, opts);
}

/**
 * Get or create a config file handle singleton (based on dir).
 */
export async function getOrCreate<D extends t.ConfigFileDoc>(
  dir: t.StringDir,
  initial: D,
  opts: t.ConfigFileGetOptions = {},
): Promise<t.ConfigFile<D>> {
  type F = t.ConfigFile<D>;
  const { filename = 'config.json' } = opts;
  const path = Fs.join(Fs.resolve(dir), filename);

  // Create the immutable and
  const seed = (await Fs.exists(path)) ? (await Fs.readJson<D>(path)).data! : initial;
  if (!seed['.meta'].createdAt) seed['.meta'].createdAt = Time.now.timestamp;
  const doc = Immutable.clonerRef(seed) as unknown as F;

  const file: F['file'] = {
    get path() {
      return path;
    },
    async save() {
      doc.change((d) => (d['.meta'].modifiedAt = Time.now.timestamp));
      const { error } = await Fs.writeJson(path, doc.current);
      return { error };
    },
  };

  // Extend the API.
  Object.defineProperty(doc, 'file', { get: () => file, enumerable: true, configurable: false });
  const api = doc as t.ConfigFile<D>;

  // Finish up.
  return api;
}
