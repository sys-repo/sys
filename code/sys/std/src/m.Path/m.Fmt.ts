import type { t } from './common.ts';
import type { PathFormatLib } from './t.ts';

/**
 * CLI Formatting tools.
 */
export const Format: PathFormatLib = {
  /**
   * Path color formatting.
   */
  string(path, fmt) {
    if (typeof path !== 'string') return `[Invalid:${typeof path}]`;
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
    type P = t.PathFormatterPart;
    return path
      .split(divider)
      .flatMap((part, index, array) => (index < array.length - 1 ? [part, divider] : [part]))
      .filter((part) => !!part)
      .map((part, index, array): P => {
        const first = index === 0;
        const last = index === array.length - 1;
        const kind: P['kind'] = part === divider ? 'slash' : last ? 'basename' : 'dirname';
        const is: P['is'] = {
          first,
          last,
          slash: kind === 'slash',
          dirname: kind === 'dirname',
          basename: kind === 'basename',
        };
        return { index, kind, part, path, is };
      });
  },
} as const;
