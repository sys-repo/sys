import { type t, Fs, Is } from './common.ts';
import { getOrCreate } from './u.getOrCreate.ts';

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
