import { Is, Str, type t } from '../common.ts';
import { nonNegativeInt, optionalPositiveInt } from './u.number.ts';
import { visibleWidth } from './u.width.ts';

const PRESERVE_PATTERNS = [
  /^`[^`]+`[.:;]?$/,
  /^\$\s+\S+/,
  /^deno\s+(bundle|check|doc|fmt|install|lint|publish|run|task|test)\b/,
  /^https?:\/\/\S+$/,
] as const;

type WrapLineOptions = {
  readonly indent: number;
  readonly continuationIndent: number;
};

export function wrap(input: string, options: t.CliFormatText.Wrap.Options): string {
  return wrapLines(input, options).join('\n');
}

export function wrapLines(
  input: string,
  options: t.CliFormatText.Wrap.Options,
): readonly string[] {
  const width = optionalPositiveInt(options.width) ?? 0;
  const indent = nonNegativeInt(options.indent, 0);
  const continuationIndent = nonNegativeInt(options.continuationIndent, indent);
  const lines: string[] = [];
  let fenced = false;
  let fenceIndent = 0;

  sourceLines(input).forEach((line) => {
    const lineIndent = lines.length === 0 ? indent : continuationIndent;
    const fenceLine = line.trimStart().startsWith('```');

    if (fenced) {
      lines.push(prefixText(line, fenceIndent));
      if (fenceLine) fenced = false;
      return;
    }

    if (fenceLine) {
      fenceIndent = lineIndent;
      fenced = true;
      lines.push(prefixText(line, lineIndent));
      return;
    }

    if (shouldPreserveLine(line, options.preserve)) {
      lines.push(prefixText(line, lineIndent));
      return;
    }

    lines.push(...wrapLine(line, width, { indent: lineIndent, continuationIndent }));
  });

  return lines;
}

/**
 * Helpers:
 */
function sourceLines(input: string): readonly string[] {
  return Str.trimEdgeNewlines(input).split('\n');
}

function wrapLine(input: string, width: number, options: WrapLineOptions): readonly string[] {
  const text = input.trim();
  if (text.length === 0) return [''];

  const prefix = ' '.repeat(options.indent);
  if (width <= 0) return [`${prefix}${input}`];
  if (visibleWidth(`${prefix}${input}`) <= width) return [`${prefix}${input}`];

  const leading = input.match(/^\s*/)?.[0] ?? '';

  const firstPrefix = `${prefix}${leading}`;
  const wrappedPrefix = `${' '.repeat(options.continuationIndent)}${leading}`;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  let currentPrefix = firstPrefix;
  let available = Math.max(1, width - visibleWidth(currentPrefix));

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (visibleWidth(next) <= available || line.length === 0) {
      line = next;
    } else {
      lines.push(`${currentPrefix}${line}`);
      currentPrefix = wrappedPrefix;
      available = Math.max(1, width - visibleWidth(currentPrefix));
      line = word;
    }
  });

  if (line) lines.push(`${currentPrefix}${line}`);
  return lines;
}

function shouldPreserveLine(
  input: string,
  preserve: t.CliFormatText.Wrap.Preserve = 'default',
): boolean {
  const text = input.trim();
  if (text.length === 0 || preserve === 'none') return false;
  if (isPreserveFn(preserve)) return preserve(input);
  return PRESERVE_PATTERNS.some((pattern) => pattern.test(text));
}

function isPreserveFn(
  input: t.CliFormatText.Wrap.Preserve,
): input is t.CliFormatText.Wrap.PreserveFn {
  return Is.func(input);
}

function prefixText(input: string, width: number): string {
  if (input.length === 0) return '';
  return `${' '.repeat(Math.max(0, width))}${input}`;
}
