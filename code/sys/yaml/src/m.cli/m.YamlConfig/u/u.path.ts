import { Fs } from '../common.ts';

const DEFAULT_EXT = '.yaml';

/** Pure path/ref helpers used by the YAML config ref resolver. */
export const RefPath = Object.freeze(
  {
    DEFAULT_EXT,

    requireValue(input: unknown, label: string, errorPrefix: string): string {
      const text = String(input ?? '').trim();
      if (!text) throw new Error(`${errorPrefix}: missing required ${label}.`);
      return text;
    },

    normalizeExt(ext: string = DEFAULT_EXT): string {
      const text = String(ext ?? '').trim();
      if (!text) return DEFAULT_EXT;
      return text.startsWith('.') ? text : `.${text}`;
    },

    trimTrailingSlash(input: string): string {
      return input.replace(/\/+$/, '');
    },

    isPathLike(value: string): boolean {
      const lower = value.toLowerCase();
      return value.startsWith('/') ||
        value.startsWith('./') ||
        value.startsWith('../') ||
        value.startsWith('~/') ||
        value.includes('/') ||
        lower.endsWith('.yaml') ||
        lower.endsWith('.yml');
    },

    nameFromPath(path: string, label: string, errorPrefix: string): string {
      const base = Fs.basename(path);
      const name = base.replace(/\.ya?ml$/i, '').trim();
      if (!name) throw new Error(`${errorPrefix}: could not derive name from ${label}.`);
      return name;
    },
  } as const,
);
