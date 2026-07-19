import { Color, css, type t } from '../common.ts';

export type MarkdownStyles = ReturnType<typeof createStyles>;

export function createStyles(args: { debug: boolean; theme: t.Color.Theme }) {
  const { debug, theme } = args;
  return {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'flow-root',
    }),
    paragraph: css({ margin: '0 0 0.65em 0', ':last-child': { marginBottom: 0 } }),
    list: css({
      margin: '0.35em 0 0.65em 0',
      paddingLeft: 20,
      ':first-child': { marginTop: 0 },
      ':last-child': { marginBottom: 0 },
    }),
    listItem: css({ marginTop: '0.25em' }),
    strong: css({ fontWeight: 'bold' }),
    emphasis: css({ fontStyle: 'italic' }),
    link: css({ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }),
    inlineCode: css({
      color: 'inherit',
      fontFamily: 'monospace',
      fontSize: '0.9em',
    }),
    error: css({ color: Color.alpha(theme.fg, 0.7) }),
  };
}
