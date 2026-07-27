import { Is, Str, type t } from '../common.ts';
import { nonNegativeInt, optionalPositiveInt } from './u.number.ts';
import { measure } from './u.width.ts';

const PRESERVE_PATTERNS = [
  /^`[^`]+`[.:;]?$/,
  /^\$\s+\S+/,
  /^deno\s+(bundle|check|doc|fmt|install|lint|publish|run|task|test)\b/,
  /^https?:\/\/\S+$/,
] as const;

type WrapLineOptions = {
  indent: number;
  continuationIndent: number;
};

/** Soft-wrap prose and join the resulting display lines with newlines. */
export function text(input: string, options: t.CliFormatText.Wrap.Options): string {
  return lines(input, options).join('\n');
}

/** Soft-wrap prose into display lines while retaining explicit boundaries and preserved lines. */
export function lines(
  input: string,
  options: t.CliFormatText.Wrap.Options,
): readonly string[] {
  const width = optionalPositiveInt(options.width) ?? 0;
  const indent = nonNegativeInt(options.indent, 0);
  const continuationIndent = nonNegativeInt(options.continuationIndent, indent);
  const output: string[] = [];
  let fenced = false;
  let fenceIndent = 0;

  sourceLines(input).forEach((line) => {
    const lineIndent = output.length === 0 ? indent : continuationIndent;
    const fenceLine = line.trimStart().startsWith('```');

    if (fenced) {
      output.push(prefixText(line, fenceIndent));
      if (fenceLine) fenced = false;
      return;
    }

    if (fenceLine) {
      fenceIndent = lineIndent;
      fenced = true;
      output.push(prefixText(line, lineIndent));
      return;
    }

    if (shouldPreserveLine(line, options.preserve)) {
      output.push(prefixText(line, lineIndent));
      return;
    }

    output.push(...wrapLine(line, width, { indent: lineIndent, continuationIndent }));
  });

  return output;
}

/** Soft-wrapping implementation grouped by text and line output. */
export const Wrap: t.CliFormatText.Wrap.Lib = { text, lines };

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
  if (measure(`${prefix}${input}`) <= width) return [`${prefix}${input}`];

  const leading = input.match(/^\s*/)?.[0] ?? '';

  const firstPrefix = `${prefix}${leading}`;
  const wrappedPrefix = `${' '.repeat(options.continuationIndent)}${leading}`;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  let currentPrefix = firstPrefix;
  let available = Math.max(1, width - measure(currentPrefix));

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) <= available || line.length === 0) {
      line = next;
    } else {
      lines.push(`${currentPrefix}${line}`);
      currentPrefix = wrappedPrefix;
      available = Math.max(1, width - measure(currentPrefix));
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
