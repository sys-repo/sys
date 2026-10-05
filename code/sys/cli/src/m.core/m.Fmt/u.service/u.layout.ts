import { c } from '../common.ts';
import { Text } from '../../m.Fmt.Text/mod.ts';
import { assertOutputCodeUnits } from '../../m.Fmt.Text/u/u.budget.ts';

const COLORS = {
  plain: (text: string) => text,
  gray: c.gray,
  green: c.green,
  white: c.white,
  yellow: c.yellow,
  cyan: c.cyan,
  dim: (text: string) => c.dim(c.gray(text)),
  annotation: (text: string) => c.dim(c.cyan(text)),
  port: (text: string) => c.bold(c.cyan(text)),
};

export type ServiceColor = keyof typeof COLORS;
export type ServiceTextPart = { readonly text: string; readonly color: ServiceColor };
export type ServiceTextOptions = {
  readonly check: (length: number, cells: number) => void;
  readonly color?: ServiceColor;
  readonly fragments?: (text: string, offset: number) => readonly ServiceTextPart[];
  readonly underline?: boolean;
  readonly compose?: typeof composeServiceText;
};

/** Fit one physical line, retaining the service's small, fixed set of styled fragments. */
export function fitServiceText(
  text: string,
  width: number | undefined,
  options: ServiceTextOptions,
): string {
  if (width === 0) {
    options.check(0, 0);
    return '';
  }
  const fragments = (text: string, offset: number): readonly ServiceTextPart[] => {
    return options.fragments?.(text, offset) ?? [{ text, color: options.color ?? 'gray' }];
  };
  const finish = (parts: readonly ServiceTextPart[], cells: number) => {
    const underline = options.underline ?? false;
    const length = styledLineBudget(parts, underline);
    options.check(length, cells);
    const compose = options.compose ?? composeServiceText;
    return compose(parts, underline);
  };
  const measure = Text.Width.measure;
  const cells = measure(text);
  if (width === undefined || cells <= width) return finish(fragments(text, 0), cells);
  return Text.ellipsize(text, width, {
    render({ head, ellipsis, tail }) {
      const marker: ServiceTextPart[] = ellipsis ? [{ text: ellipsis, color: 'dim' }] : [];
      const start = fragments(head, 0);
      const end = fragments(tail, text.length - tail.length);
      const parts = [...start, ...marker, ...end];
      const cells = measure(head) + measure(ellipsis) + measure(tail);
      return finish(parts, cells);
    },
  });
}

/** Internal composition seam; callers admit the complete styled line before invoking it. */
export function composeServiceText(parts: readonly ServiceTextPart[], underline: boolean): string {
  const text = parts.map(({ text, color }) => COLORS[color](text)).join('');
  return underline ? c.underline(text) : text;
}

/** Choose label and value column widths for the whole service list. */
export function serviceLayout(labels: string[], width: number | undefined) {
  const natural = Text.Width.max(labels);
  const gap = width !== undefined && width < 4 ? 0 : 3;
  const labelWidth = width === undefined
    ? natural
    : Math.min(natural, Math.floor((width - gap) / 2));
  const reserve = labelWidth + gap;
  return { labelWidth, reserve, valueWidth: width === undefined ? undefined : width - reserve };
}

/** Select the fragment overlapping a range, without styling or joining it yet. */
export function serviceFragment(
  text: string,
  offset: number,
  start: number,
  end: number,
  color: ServiceColor,
): readonly ServiceTextPart[] {
  const from = Math.max(offset, start);
  const to = Math.min(offset + text.length, end);
  return from >= to ? [] : [{ text: text.slice(from - offset, to - offset), color }];
}

/** Admit the peak textual projection, including inner styles that an outer reset may shorten. */
function styledLineBudget(parts: readonly ServiceTextPart[], underline: boolean): number {
  let length = 0;
  let peak = 0;
  for (const { text, color } of parts) {
    const inner = innerColor(color);
    if (inner) peak = Math.max(peak, length + text.length + inner(' ').length - 1);
    const style = COLORS[color];
    const framing = style(' ').length - 1;
    // Foreground close/open codes have equal lengths. Dim/bold rewrite 22m to 2m/1m.
    const reset = '\x1b[22m';
    const delta = style(reset).length - reset.length - framing;
    length += text.length + framing + resetAdjustment(text, reset, delta);
    peak = Math.max(peak, length);
  }
  assertOutputCodeUnits(peak);
  if (!underline) return peak;

  // No palette member introduces or replaces underline controls; only source text can carry them.
  const reset = '\x1b[24m';
  const framing = c.underline(' ').length - 1;
  const delta = c.underline(reset).length - reset.length - framing;
  const adjustment = parts.reduce((sum, part) => sum + resetAdjustment(part.text, reset, delta), 0);
  return Math.max(peak, length + framing + adjustment);
}

/** Measure reset rewriting without allocating a split collection during admission. */
function resetAdjustment(text: string, reset: string, delta: number): number {
  if (delta === 0) return 0;
  let adjustment = 0;
  let cursor = text.indexOf(reset);
  while (cursor !== -1) {
    adjustment += delta;
    cursor = text.indexOf(reset, cursor + reset.length);
  }
  return adjustment;
}

/** Only these fixed palette entries apply two successive color encoders. */
function innerColor(color: ServiceColor) {
  if (color === 'dim') return c.gray;
  if (color === 'annotation' || color === 'port') return c.cyan;
}
