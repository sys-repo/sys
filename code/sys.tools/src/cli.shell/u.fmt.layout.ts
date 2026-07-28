import { c, Cli, Str, type t } from './common.ts';

/** A labeled output section rendered as a left-column heading and right-column content. */
export type Section = {
  label: string;
  lines: readonly string[];
};

/** Render a shell command report with stable ANSI-safe section columns and one trailing newline. */
export function renderShellOutput(title: string, sections: readonly Section[]): string {
  const labelWidth = maxVisibleWidth(sections.map((section) => section.label));
  const out = Str.builder()
    .line(`  ${c.green('system:shell')} ${c.gray(title)}`)
    .blank();

  sections.forEach((section, index) => {
    if (index > 0) out.blank();
    appendSection(out, section, labelWidth);
  });

  return `${Str.trimEdgeNewlines(out.toString())}\n`;
}

/** Format a labeled value with ANSI-safe label padding. */
export function field(label: string, value: string, width: number): string {
  return `${c.gray(padVisibleEnd(`${label}:`, width))} ${value}`;
}

/** Format a successful labeled value with ANSI-safe label padding. */
export function successField(label: string, value: string, width: number): string {
  return `${c.green(padVisibleEnd(`${label}:`, width))} ${value}`;
}

/** Format warning lines, optionally falling back to a successful status line. */
export function warningLines(warnings: readonly string[], fallback?: string): readonly string[] {
  if (warnings.length > 0) return warnings.map((warning) => `${c.yellow('!')} ${warning}`);
  if (fallback) return [`${c.green('✓')} ${fallback}`];
  return [];
}

/** Format a comma-delimited list of cyan labels, or `(none)`. */
export function listLabels(values: readonly string[]): string {
  if (values.length === 0) return c.gray('(none)');
  return values.map((value) => c.cyan(value)).join(', ');
}

function appendSection(
  out: t.StrBuilder,
  section: Section,
  labelWidth: number,
): void {
  const lines = section.lines.length ? section.lines : [c.gray('(none)')];

  lines.forEach((line, index) => {
    const label = index === 0 ? c.bold(section.label) : '';
    out.line(`${sectionPrefix(label, labelWidth)}${line}`);
  });
}

function sectionPrefix(label: string, width: number): string {
  return `  ${padVisibleEnd(label, width)}  `;
}

function visibleWidth(input: string): number {
  return Cli.Fmt.Text.Width.measure(input);
}

function maxVisibleWidth(input: readonly string[]): number {
  return input.reduce((max, item) => Math.max(max, visibleWidth(item)), 0);
}

function padVisibleEnd(input: string, width: number): string {
  return `${input}${' '.repeat(Math.max(0, width - visibleWidth(input)))}`;
}
