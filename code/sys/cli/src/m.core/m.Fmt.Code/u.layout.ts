import { c, Is, Num, Str, stripAnsi } from '../common.ts';
import type { CliFormatCode } from './t.ts';

export type LayoutOptions = CliFormatCode.LayoutOptions & {
  readonly lang?: string;
};

export function sourceLines(text: string): readonly string[] {
  return Str.trimEdgeNewlines(text).split('\n');
}

export function layout(lines: readonly string[], options: LayoutOptions = {}): string {
  const indent = wrangle.indent(options.indent);
  const rendered = options.fence === true ? wrangle.fenced(lines, options.lang) : lines;
  return wrangle.indented(rendered, indent);
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
    return lines.map((line) => stripAnsi(line).length > 0 ? `${pad}${line}` : '').join('\n');
  },

  indent(input = 0): number {
    if (!Num.Is.finite(input)) return 0;
    if (!Num.Is.int(input)) return 0;
    return Num.clamp(0, Num.MAX_INT, input);
  },
} as const;

export function langLabel(input: unknown): string | undefined {
  return Is.string(input) ? input : undefined;
}
