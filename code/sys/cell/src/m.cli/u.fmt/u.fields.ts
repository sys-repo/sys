import { c, stripAnsi } from '../common.ts';

export const FmtFields = {
  title,
  label,
  labelWidth,
  padLabel,
  indent,
} as const;

/**
 * Helpers:
 */
function title(value: string): string {
  return c.green(value);
}

function label(value: string, width = value.length): string {
  return c.dim(c.gray(padLabel(value, width)));
}

function labelWidth(labels: readonly string[]): number {
  return labels.reduce((max, label) => Math.max(max, stripAnsi(label).length), 0);
}

function padLabel(value: string, width: number): string {
  const pad = Math.max(0, width - stripAnsi(value).length);
  return `${value}${' '.repeat(pad)}`;
}

function indent(level: number): string {
  return '  '.repeat(Math.max(0, Math.floor(level)));
}
