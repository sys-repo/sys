import { Is, type t } from '../common.ts';

/**
 * CLI Formatting tools.
 */
export const Format: t.Path.Format.Lib = {
  /**
   * Path color formatting.
   */
  string(path, fmt) {
    if (!Is.string(path)) return `[Invalid:${typeof path}]`;
    if (!fmt) return path;

    const divider = '/';
    const parts = wrangle.parts(path, divider);

    const res: string[] = [];
    parts.forEach((part) => {
      let text = part.part;
      fmt({
        ...part,
        change: (to) => (text = to),
        toString: () => text,
        get part() {
          return text;
        },
      });
      res.push(text);
    });

    return res.join('');
  },
};

/**
 * Helpers
 */
const wrangle = {
  parts(path: string, divider: string) {
    const parts = path
      .split(divider)
      .flatMap((part, index, array) => (index < array.length - 1 ? [part, divider] : [part]))
      .filter((part) => !!part);

    return parts.map((part, index, array): t.Path.Format.Part => {
      const first = index === 0;
      const last = index === array.length - 1;
      const kind = wrangle.kind(part, divider, index, array);
      const is: t.Path.Format.Part['is'] = {
        first,
        last,
        slash: kind === 'slash',
        dirname: kind === 'dirname',
        basename: kind === 'basename',
      };
      return { index, kind, part, path, is };
    });
  },

  /**
   * Determine the kind of a path part.
   *
   * Rules:
   * - literal divider → 'slash'
   * - the last non-slash segment → 'basename' (even if path ends with divider)
   * - otherwise → 'dirname'
   *
   * Examples:
   *  - "foo/bar/baz"  → ['dirname','slash','dirname','slash','basename']
   *  - "foo/bar/baz/" → ['dirname','slash','dirname','slash','basename','slash']
   *  - "foo/bar/"     → ['dirname','slash','basename','slash']
   */
  kind(
    part: string,
    divider: string,
    index: number,
    array: readonly string[],
  ): t.Path.Format.Part['kind'] {
    if (part === divider) return 'slash';

    // Find the index of the last non-slash element in the flattened parts array.
    let lastNonSlash = -1;
    for (let i = array.length - 1; i >= 0; i--) {
      if (array[i] !== divider) {
        lastNonSlash = i;
        break;
      }
    }

    return index === lastNonSlash ? 'basename' : 'dirname';
  },
} as const;
