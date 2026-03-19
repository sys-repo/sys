import { c } from './common.ts';

export const LINE = '━'.repeat(84);

export function print(lines: readonly string[]) {
  for (const line of lines) console.info(line);
}

export function row(
  label: string,
  value: string,
  options: { color?: 'white' | 'cyan' | 'gray' | 'green' | 'red'; width?: number; indent?: number } = {},
) {
  const head = c.gray(normalizeLabel(label).padEnd(options.width ?? 5));
  const text =
    options.color === 'green'
      ? c.green(value)
      : options.color === 'red'
        ? c.red(value)
      : options.color === 'cyan'
        ? c.cyan(value)
        : options.color === 'gray'
          ? c.gray(value)
          : c.white(value);
  return `${indent(options.indent)}${head} ${c.gray('│')} ${text}`;
}

export function richRow(label: string, parts: readonly string[], width = 5, indentBy = 0) {
  const head = c.gray(normalizeLabel(label).padEnd(width));
  return `${indent(indentBy)}${head} ${c.gray('│')} ${parts.join('')}`;
}

export function toneColor(tone: 'warning' | 'success') {
  return tone === 'warning' ? c.yellow : c.green;
}

export function maxLabelWidth(labels: readonly string[]) {
  return Math.max(5, ...labels.map((label) => normalizeLabel(label).length));
}

function indent(count = 0) {
  return ' '.repeat(count);
}

function normalizeLabel(label: string) {
  return label.length === 0 ? label : label.toLowerCase();
}
