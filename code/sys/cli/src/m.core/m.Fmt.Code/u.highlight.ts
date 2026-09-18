import type { codeToTokens } from 'shiki';
import { Color, D, Is } from './common.ts';
import type { CliFormatCode } from './t.ts';
import { langLabel, layout, sourceLines } from './u.layout.ts';

type ShikiTokenize = typeof codeToTokens;
type TokenizeResult = Awaited<ReturnType<ShikiTokenize>>;
type Token = TokenizeResult['tokens'][number][number];

/** Format a terminal code snippet with Shiki-backed ANSI syntax highlighting. */
export async function highlight(
  text: string,
  options: CliFormatCode.Highlight.Options,
): Promise<string> {
  const source = sourceLines(text).join('\n');
  const shiki = await import('shiki');
  const result = await shiki.codeToTokens(source, shikiOptions(options));
  const lines = result.tokens.map((line) => line.map(token).join(''));

  return layout(lines, {
    indent: options.indent,
    fence: options.fence,
    lang: langLabel(options.lang),
  });
}

/**
 * Helpers:
 */
function shikiOptions(
  options: CliFormatCode.Highlight.Options,
): CliFormatCode.Highlight.ShikiOptions {
  const { fence: _, indent: __, ...rest } = options;
  if ('theme' in rest || 'themes' in rest) return rest as CliFormatCode.Highlight.ShikiOptions;
  return { ...rest, theme: D.theme } as CliFormatCode.Highlight.ShikiOptions;
}

function token(input: Token): string {
  if (input.content.length === 0) return '';

  const styles = [fontStyle(input.fontStyle), foreground(tokenColor(input))].filter((style) =>
    style.length > 0
  );
  if (styles.length === 0) return input.content;
  return `${styles.join('')}${input.content}${Color.escape.reset}`;
}

function tokenColor(input: Token): string | undefined {
  if (Is.string(input.color)) return input.color;
  const style = input.htmlStyle;
  if (!style || !Is.string(style.color)) return undefined;
  return style.color;
}

function fontStyle(input: number | undefined): string {
  if (!Is.number(input) || input <= 0) return '';

  const styles: string[] = [];
  if ((input & 1) === 1) styles.push(Color.escape.italic);
  if ((input & 2) === 2) styles.push(Color.escape.bold);
  if ((input & 4) === 4) styles.push(Color.escape.underline);
  return styles.join('');
}

function foreground(input?: string): string {
  if (!Is.string(input)) return '';

  const hex = /^#([0-9a-f]{6})$/i.exec(input)?.[1];
  if (!hex) return '';

  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}
