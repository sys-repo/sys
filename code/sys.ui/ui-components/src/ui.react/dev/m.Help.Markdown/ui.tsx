import { Anchor, Chip, Color, css, D, ProseMarkdown, type t } from './common.ts';

/** Markdown help renderer with dev-friendly inline-code and link defaults. */
export const DevHelpMarkdown: t.FC<t.DevHelpMarkdown.Props> = (props) => {
  const theme = Color.theme(props.theme);
  const renderers = toRenderers(theme.name, props.renderers);
  const styles = {
    base: css({ fontSize: D.fontSize, lineHeight: D.lineHeight }),
  };

  return (
    <ProseMarkdown.UI
      {...props}
      theme={theme.name}
      renderers={renderers}
      style={css(styles.base, props.style)}
    />
  );
};

/**
 * Helpers:
 */
function toRenderers(
  theme: t.CommonTheme,
  renderers?: t.ProseMarkdown.Renderers,
): t.ProseMarkdown.Renderers {
  return {
    inlineCode(e) {
      return <Chip.UI mono theme={theme}>{e.value}</Chip.UI>;
    },
    link(e) {
      return (
        <Anchor.UI href={e.href} title={e.title} target='_blank' theme={theme}>
          {e.children}
        </Anchor.UI>
      );
    },
    ...renderers,
  };
}
