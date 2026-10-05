import { Color, css, type t } from '../common.ts';

const blockMarginEdges: t.CssValue = {
  ':first-child': { marginTop: 0 },
  ':last-child': { marginBottom: 0 },
};

export function createStyles(
  args: { debug: boolean; theme: t.Color.Theme },
): t.ProseMarkdown.Styles {
  const { debug, theme } = args;
  const listIndent = 20;
  return {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'flow-root',
    }),
    paragraph: css({ margin: '0 0 0.65em 0' }, blockMarginEdges),
    codeBlock: css({
      margin: '0 0 0.65em 0',
      maxWidth: '100%',
      overflowX: 'auto',
    }, blockMarginEdges),
    heading: css(blockMarginEdges),
    list: css({
      margin: '0.35em 0 0.65em 0',
      paddingLeft: listIndent,
    }, blockMarginEdges),
    listItem: css({ marginTop: '0.25em' }),
    taskListItem: css({ listStyle: 'none' }),
    taskRow: css({
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      columnGap: 6,
      alignItems: 'start',
      marginLeft: -listIndent,
    }),
    taskState: css({ display: 'flex', minWidth: 0 }),
    taskCheckbox: css({
      accentColor: theme.fg,
      margin: '0.2em 0 0',
      pointerEvents: 'none',
    }),
    taskBody: css({ minWidth: 0 }),
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
