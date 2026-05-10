import { c, Num, Str, type t } from '../common.ts';

/** Format a terminal code snippet as an indented text block. */
export function block(text: string, options: t.CliFormatCode.BlockOptions = {}): string {
  const indent = wrangle.indent(options.indent);
  const lines = wrangle.lines(text);
  const rendered = options.fence === true ? wrangle.fenced(lines, options.lang) : lines;
  const result = wrangle.indented(rendered, indent);

  if (result.length === 0) return result;
  return options.tone === 'muted' ? c.gray(result) : result;
}

/**
 * Helpers:
 */
const wrangle = {
  fenced(lines: readonly string[], lang?: string): readonly string[] {
    return [wrangle.fence(lang), ...lines, wrangle.fence()];
  },

  fence(lang?: string): string {
    return c.dim(c.gray(`\`\`\`${lang ?? ''}`));
  },

  indented(lines: readonly string[], indent: number): string {
    const pad = ' '.repeat(indent);
    return lines.map((line) => line.length > 0 ? `${pad}${line}` : '').join('\n');
  },

  indent(input = 0): number {
    if (!Num.Is.finite(input)) return 0;
    if (!Num.Is.int(input)) return 0;
    return Num.clamp(0, Num.MAX_INT, input);
  },

  lines(text: string): readonly string[] {
    return Str.trimEdgeNewlines(text).split('\n');
  },
} as const;
