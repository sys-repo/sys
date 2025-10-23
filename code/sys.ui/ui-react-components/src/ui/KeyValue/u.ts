import { type t, D, Is } from './common.ts';

type P = t.KeyValueProps;
type PixelTuple = [t.Pixels | undefined, t.Pixels | undefined];

/**
 * Produce plain CSS size value.
 */
export function toCssSize(v?: string | number): string {
  if (v == null) return 'auto';
  return typeof v === 'number' ? `${v}px` : v;
}

/**
 * Derive font properties.
 */
export function toFont(props: Pick<P, 'size' | 'mono'>) {
  const { size = D.size, mono = D.mono } = props;
  const fontSize = size === 'md' ? 13 : size === 'sm' ? 11 : 10;
  const fontFamily = mono ? 'monospace' : 'sans-serif';
  return { fontSize, fontFamily } as const;
}

/**
 * Text overflow / wrapping helper.
 * - When `truncate` is true → single-line with ellipsis.
 * - When `truncate` is false → natural wrapping with safe word breaks.
 */
export function toEllipsis(truncate: boolean = D.truncate): t.CssProps {
  return truncate
    ? {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }
    : {
        whiteSpace: 'normal',
        wordBreak: 'break-word', //     classic safe break
        overflowWrap: 'break-word', //  ensure min-content doesn't collapse
      };
}

/**
 * Normalise layout config.
 */
export function toLayout(layout?: t.KeyValueLayout): NonNullable<t.KeyValueLayout> {
  if (layout?.kind === 'spaced' || layout?.kind === 'table') return layout;
  return D.layout[D.layout.default];
}

/**
 * Derive spacing CSS values.
 */
export function toSpacing(inputX?: t.KeyValueSpacing, inputY?: t.KeyValueSpacing) {
  const x = toSpacingTuple(inputX);
  const y = toSpacingTuple(inputY);
  const edges: t.CssEdgesArray = [y[0], x[1], y[1], x[0]];
  return { x, y, edges };
}
export function toSpacingTuple(value?: t.Pixels | [t.Pixels, t.Pixels]): PixelTuple {
  if (value == null) return [undefined, undefined];
  if (Is.array(value)) return [value[0], value[1]];
  if (Is.number(value)) return [value, value];
  return [undefined, undefined];
}
