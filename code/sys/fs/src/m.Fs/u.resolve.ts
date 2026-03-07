import { type t, Path, Is } from './common.ts';
import { Tilde } from './m.Tilde.ts';

export const resolve: t.Fs.Resolve = (...parts) => {
  const { pathParts, options } = wrangle.resolve(parts);
  const next = options.expandTilde ? pathParts.map((part) => Tilde.expand(part)) : pathParts;
  return Path.resolve(...next);
};

/**
 * Helpers:
 */
const wrangle = {
  resolve(parts: readonly (string | t.Fs.ResolveOptions)[]) {
    let options: t.Fs.ResolveOptions = {};
    let pathParts = parts;
    const last = parts.at(-1);

    if (isResolveOptions(last)) {
      options = last;
      pathParts = parts.slice(0, -1);
    }

    return {
      options,
      pathParts: pathParts.map((part) => {
        if (!Is.str(part)) throw new TypeError('Fs.resolve path segments must be strings.');
        return part;
      }),
    };
  },
} as const;

const isResolveOptions = (value: unknown): value is t.Fs.ResolveOptions => {
  if (!Is.plainObject(value)) return false;
  if (!('expandTilde' in value)) return true;
  return Is.bool((value as { expandTilde?: unknown }).expandTilde);
};
