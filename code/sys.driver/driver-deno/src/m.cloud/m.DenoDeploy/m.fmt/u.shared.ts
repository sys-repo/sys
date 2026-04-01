import { c, Cli, Path } from './common.ts';

export const LINE = Cli.Fmt.hr();
export const DENO_CONSOLE_HOST = 'console.deno.com';

export function print(lines: readonly string[]) {
  for (const line of lines) console.info(line);
}

export function row(
  label: string,
  value: string,
  options: {
    color?: 'white' | 'cyan' | 'gray' | 'green' | 'red' | 'yellow';
    width?: number;
    indent?: number;
  } = {},
) {
  const head = c.gray(normalizeLabel(label).padEnd(options.width ?? 5));
  const divider = c.dim(c.gray('│'));
  const text =
    options.color === 'green'
      ? c.green(value)
      : options.color === 'red'
        ? c.red(value)
        : options.color === 'yellow'
          ? c.yellow(value)
        : options.color === 'cyan'
          ? c.cyan(value)
          : options.color === 'gray'
            ? c.gray(value)
            : c.white(value);
  return `${indent(options.indent)}${head} ${divider} ${text}`;
}

export function richRow(label: string, parts: readonly string[], width = 5, indentBy = 0) {
  const head = c.gray(normalizeLabel(label).padEnd(width));
  const divider = c.dim(c.gray('│'));
  return `${indent(indentBy)}${head} ${divider} ${parts.join('')}`;
}

export function toneColor(tone: 'warning' | 'success') {
  return tone === 'warning' ? c.yellow : c.green;
}

export function maxLabelWidth(labels: readonly string[]) {
  return Math.max(5, ...labels.map((label) => normalizeLabel(label).length));
}

export function formatUrlParts(input: string, options: { readonly highlight?: readonly string[] } = {}) {
  if (input.length === 0) return [c.white('')] as const;

  try {
    const url = new URL(input);
    return [
      c.dim(c.gray(`${url.protocol}//`)),
      ...formatUrlHost(url.host, options.highlight),
      ...formatUrlTail(`${url.pathname === '/' ? '' : url.pathname}${url.search}${url.hash}`, options.highlight),
    ] as const;
  } catch {
    return [c.white(input)] as const;
  }
}

export function formatPathTail(input: string) {
  if (input.length === 0) return [c.white('')] as const;

  const normalized = input.endsWith('/') && input !== '/' ? input.slice(0, -1) : input;
  const tail = Path.basename(normalized);
  const head = normalized.slice(0, normalized.length - tail.length);
  if (head.length === 0) return [c.white(normalized)] as const;

  return [c.dim(c.gray(head)), c.white(tail)] as const;
}

function formatUrlTail(text: string, highlight: readonly string[] = []) {
  if (text.length === 0) return [] as const;
  if (highlight.length === 0) return [c.gray(text)] as const;

  let parts: string[] = [text];
  for (const token of highlight.filter((value) => value.length > 0)) {
    parts = parts.flatMap((part) => splitAndColor(part, token, 'gray'));
  }
  return parts as readonly string[];
}

function formatUrlHost(text: string, highlight: readonly string[] = []) {
  if (text.length === 0) return [] as const;
  if (highlight.length === 0) return [c.cyan(text)] as const;

  let parts: string[] = [text];
  for (const token of highlight.filter((value) => value.length > 0)) {
    parts = parts.flatMap((part) => splitAndColor(part, token, 'cyan'));
  }
  return parts as readonly string[];
}

function splitAndColor(text: string, token: string, base: 'gray' | 'cyan') {
  if (text.length === 0 || !text.includes(token)) return [base === 'cyan' ? c.cyan(text) : c.gray(text)];
  const chunks = text.split(token);
  return chunks.flatMap((chunk, index) => {
    const out = [base === 'cyan' ? c.cyan(chunk) : c.gray(chunk)];
    if (index < chunks.length - 1) out.push(c.white(token));
    return out;
  });
}

function indent(count = 0) {
  return ' '.repeat(count);
}

function normalizeLabel(label: string) {
  return label.length === 0 ? label : label.toLowerCase();
}
