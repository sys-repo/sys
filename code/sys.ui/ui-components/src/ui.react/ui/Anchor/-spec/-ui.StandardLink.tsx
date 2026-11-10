import { Color, css, type t } from './common.ts';
import { Anchor } from '../mod.ts';

/** The HTML standards reference belongs to host chrome, not the specimen. */
export const StandardLink: t.FC<{ theme?: t.CommonTheme }> = (props) => {
  const theme = Color.theme(props.theme);
  const style = css({ color: theme.fg, fontSize: 12 });
  return (
    <Anchor.Link
      href='https://html.spec.whatwg.org/multipage/text-level-semantics.html#htmlanchorelement'
      resource='web'
      openIn='new-tab'
      title='HTML Living Standard — HTMLAnchorElement interface (opens in a new tab)'
      theme={theme.name}
      style={style}
    >
      HTMLAnchorElement · WHATWG
    </Anchor.Link>
  );
};
