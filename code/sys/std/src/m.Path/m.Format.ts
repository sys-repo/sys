import type { t } from './common.ts';

/**
 * CLI Formatting tools.
 */
export const Format: t.PathFormatLib = {
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
      let text = part.text;
      fmt({
        ...part,
        change: (to) => (text = to),
        toString: () => text,
        get text() {
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
      .filter((text) => !!text)
      .map((text, index, array): P => {
        const first = index === 0;
        const last = index === array.length - 1;
        const kind: P['kind'] = text === divider ? 'slash' : last ? 'basename' : 'dirname';
        const is: P['is'] = {
          first,
          last,
          slash: kind === 'slash',
          dirname: kind === 'dirname',
          basename: kind === 'basename',
        };
        return { index, kind, text, is };
      });
  },
} as const;
