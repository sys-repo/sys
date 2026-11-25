import { Anchor } from '../Anchor/mod.ts';
import { Chip } from '../Chip/mod.ts';
import { Prose } from '../Prose/mod.ts';
import { Color, css, D, Is, type t, Url, useStylesheetRule } from './common.ts';
import { Icons } from './u.icons.ts';

export const Admonition: t.FC<t.Admonition.Props> = (props) => {
  const { debug, id, kind = D.kind, markdown, radius = D.radius } = props;
  const theme = Color.theme(props.theme);
  const Glyph = Icons[kind];

  const scope = `[data-component="${D.displayName}"]`;
  useStylesheetRule(`${scope} strong`, { color: 'var(--sys-admonition-fg)' });

  // Bring only top-level bullet markers to the prose edge. Task lists own their checkbox gutter.
  useStylesheetRule(`${scope} > div > ul:not(:has(input))`, {
    paddingLeft: '1em',
  });

  const styles = {
    base: css({
      '--sys-admonition-fg': theme.fg,
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      alignItems: 'start',
      columnGap: 8,
      padding: '11px 10px',
      borderRadius: radius,
      backgroundColor: Color.alpha(theme.fg, 0.06),
      color: theme.fg,
      fontSize: 12,
      lineHeight: 1.45,
      textAlign: 'left',
      overflowWrap: 'anywhere',
    }),
    marker: css({ display: 'flex', alignItems: 'center', height: '1lh' }),
    body: css({
      color: theme.is.dark ? Color.alpha(theme.fg, 0.65) : theme.fg,
      userSelect: (props.selectable ?? D.selectable) ? 'text' : 'none',
    }),
    lead: css({ color: theme.fg, margin: '0 0 0.25rem', ':last-child': { marginBottom: 0 } }),
    label: css({
      margin: '0.65em 0 0.2em',
      ':first-child': { marginTop: 0 },
      ':last-child': { marginBottom: 0 },
      fontSize: '0.85em',
      fontWeight: 600,
      color: Color.alpha(theme.fg, 0.4),
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }),
  };

  return (
    <div
      id={id}
      role='note'
      className={css(styles.base, props.style).class}
      data-component={D.displayName}
    >
      <span aria-hidden='true' className={styles.marker.class}>
        <Glyph as='span' size={20} />
      </span>
      <Prose.Markdown.UI
        debug={debug}
        value={markdown}
        linksTabbable={props.linksTabbable}
        theme={theme.name}
        style={styles.body}
        renderers={{
          heading({ node, depth, children }) {
            const start = node.position?.start.offset;
            if (depth === 1 && Is.number(start) && Is.blank(markdown.slice(0, start))) {
              return (
                <p className={styles.lead.class}>
                  <strong>{children}</strong>
                </p>
              );
            }
            if (depth === 2) return <p className={styles.label.class}>{children}</p>;
          },
          inlineCode({ value }) {
            return <Chip.UI mono theme={theme.name}>{value}</Chip.UI>;
          },
          link({ href, title, tabIndex, children }) {
            // Markdown has already filtered the destination. Only absolute web links open a tab.
            const url = Url.parse(href);
            const protocol = url.ok ? url.toURL().protocol : undefined;
            if (protocol === 'https:' || protocol === 'http:') {
              return (
                <Anchor.Link
                  href={href}
                  title={title}
                  tabIndex={tabIndex}
                  openIn='new-tab'
                  theme={theme.name}
                >
                  {children}
                </Anchor.Link>
              );
            }
            return (
              <Anchor.UI href={href} title={title} tabIndex={tabIndex} theme={theme.name}>
                {children}
              </Anchor.UI>
            );
          },
        }}
      />
    </div>
  );
};
