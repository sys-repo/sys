import { type t, Is, Time, Immutable, Fs } from './common.ts';

/**
 * Singleton instances
 */
const Singleton = new Map<t.StringDir, t.CrdtConfig>();

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
  const { filename = 'config.json' } = opts;
  const path = Fs.join(Fs.resolve(dir), filename);

  const existing = Singleton.get(dir);
  if (existing) return existing as t.ConfigFile<D>;

  // Initialize a fresh immutable-config ref from the provided initial doc.
  if (!initial['.meta'].createdAt) initial['.meta'].createdAt = Time.now.timestamp;

  type F = t.ConfigFile<D>;
  const file: F['file'] = {
    get path() {
      return path;
    },
  };

  // Create the immutable API.
  const ref = Immutable.clonerRef(initial) as t.ConfigFile<D>;
  Object.defineProperty(ref, 'file', { get: () => file, enumerable: true, configurable: false });
  const api = ref as t.ConfigFile<D>;

  // Finish up.
  Singleton.set(dir, api);
  return api;
}
