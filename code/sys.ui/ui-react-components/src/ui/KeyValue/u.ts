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
  if (layout?.kind === 'spaced' || layout?.kind === 'table') return layout;
  return D.layout[D.layout.default];
}
