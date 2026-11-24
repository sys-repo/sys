import { Anchor, Chip, Color, css, Prose, type t, useStylesheetRule } from './common.ts';
import { Icons } from './u.icons.ts';

type Props = { id: string; markdown: string; theme?: t.CommonTheme };

/** Context for registering a credential, not an error or live status announcement. */
export const RegistrationNote: t.FC<Props> = (props) => {
  const theme = Color.theme(props.theme);
  const panel = css({
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    alignItems: 'start',
    columnGap: 8,
    marginTop: 30,
    padding: '8px 10px',
    borderRadius: 4,
    backgroundColor: Color.alpha(theme.fg, 0.06),
    color: theme.fg,
    fontSize: 12,
    lineHeight: 1.45,
    textAlign: 'left',
    overflowWrap: 'anywhere',
  });
  const bodyColor = theme.is.dark ? Color.alpha(theme.fg, 0.65) : theme.fg;
  useStylesheetRule(`.${panel.class} strong`, { color: theme.fg });
  return (
    <div id={props.id} role='note' className={panel.class}>
      <span aria-hidden='true'>
        <Icons.Hint as='span' size={20} offset={[0, 2]} />
      </span>
      <Prose.Markdown.UI
        value={props.markdown}
        theme={theme.name}
        style={{ color: bodyColor }}
        renderers={{
          inlineCode({ value }) {
            return <Chip.UI mono theme={theme.name}>{value}</Chip.UI>;
          },
          link({ href, title, children }) {
            return (
              <Anchor.Link href={href} title={title} openIn='new-tab' theme={theme.name}>
                {children}
              </Anchor.Link>
            );
          },
        }}
      />
    </div>
  );
};
