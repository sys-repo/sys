import { Str } from './common.ts';

/**
 * Script helpers for preparing shell template strings.
 */
export const Script = {
  /**
   * Dedent a template literal intended for `sh -c`.
   */
  t(strings: TemplateStringsArray, ...values: unknown[]) {
    const raw = strings.reduce((acc, s, i) => acc + String(values[i - 1] ?? '') + s);
    return Str.dedent(raw);
  },

  /**
   * Dedent and tightly trim a multiline template string.
   *  - Uses `Str.dedent` for standard indentation removal.
   *  - Additionally strips all leading and trailing blank lines.
   * Ideal for clean shell scripts passed to `sh -c`.
   */
  tight(strings: TemplateStringsArray, ...values: unknown[]) {
    const raw = strings.reduce((acc, s, i) => acc + String(values[i - 1] ?? '') + s);
    const d = Str.dedent(raw);
    const lines = d.split('\n');
    while (lines.length && lines[0].trim() === '') lines.shift();
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    return lines.join('\n');
  },
} as const;
