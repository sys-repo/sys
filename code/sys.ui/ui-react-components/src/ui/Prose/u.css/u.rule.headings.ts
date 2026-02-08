import { type t, Color, ET_BOOK } from './common.ts';

export function headings(args: { rule: t.Prose.ScopedCssRule; theme: t.ColorTheme }) {
  const { rule, theme } = args;
  rule('h1', {
    fontFamily: `"${ET_BOOK.family}", Georgia, serif`,
    fontWeight: 400,
    fontSize: '3em',
    lineHeight: 1.1,
  });
}
