import { Cli } from '../common.host.ts';

/** Fit each physical label line independently, including its style scope. */
export function fittedLabel(
  input: string,
  width: number | undefined,
  color: (text: string) => string,
) {
  return input.split('\n').map((line) => fittedValue(line, width, color)).join('\n');
}

/** Fit one display line; undefined width preserves full non-TTY output. */
export function fittedValue(
  input: string,
  width: number | undefined,
  color: (text: string) => string,
) {
  if (width === undefined || Cli.Fmt.Text.Width.measure(input) <= width) return color(input);
  return Cli.Fmt.Text.ellipsize(input, width, {
    render({ head, ellipsis, tail }) {
      return `${color(head)}${Cli.Fmt.omission(ellipsis)}${color(tail)}`;
    },
  });
}

/** Leave room for the cell gap and a value column beside fitted labels. */
export function labelWidth(width: number): number {
  return width > Cli.Table.cellGap ? Math.floor((width - Cli.Table.cellGap) / 2) : 0;
}

/** Available value cells after the label column reservation. */
export function valueWidth(width: number, reserve: number): number {
  return width > 0 ? Math.max(0, width - reserve) : 0;
}

/** Reserve the widest physical label line plus the canonical cell gap. */
export function labelReserve(labels: readonly string[]): number {
  const lines = labels.flatMap((label) => label.split('\n'));
  return Cli.Fmt.Text.Width.max(lines) + Cli.Table.cellGap;
}
