import { type t, D, Is } from './common.ts';

type P = t.KeyValueProps;

export function toCssSize(v?: string | number): string {
  if (v == null) return 'auto';
  return typeof v === 'number' ? `${v}px` : v;
}

export function toFont(props: Pick<P, 'size' | 'mono'>) {
  const { size = D.size, mono = D.mono } = props;
  const fontSize = size === 'md' ? 13 : size === 'sm' ? 11 : 10;
  const fontFamily = mono ? 'monospace' : 'sans-serif';
  return { fontSize, fontFamily } as const;
}

export function toEllipsis(truncate: boolean = D.truncate): t.CssProps {
  return truncate
    ? {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }
    : {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      };
}

export function toLayout(layout?: t.KeyValueLayout): NonNullable<t.KeyValueLayout> {
  return {
    variant: layout?.variant ?? D.layout.variant,
    keyMax: layout?.keyMax ?? D.layout.keyMax,
    keyAlign: layout?.keyAlign ?? D.layout.keyAlign,
    columnGap: layout?.columnGap ?? D.layout.columnGap,
    rowGap: layout?.rowGap ?? D.layout.rowGap,
    align: layout?.align ?? D.layout.align,
  };
}

export function toEdgeOffset(
  value?: t.Pixels | [t.Pixels, t.Pixels],
): [t.Pixels | undefined, t.Pixels | undefined] {
  if (value == null) return [undefined, undefined];
  if (Is.array(value)) return [value[0], value[1]];
  if (Is.number(value)) return [value, value];
  return [undefined, undefined];
}
