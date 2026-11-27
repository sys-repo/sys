import { Color, css, D, type t } from './common.ts';
import { controlFocus } from '../../../m.style/m.FocusStyle/u.controlFocus.ts';

const solidUnderline = { textDecoration: 'underline solid currentColor' } as const;
const focus = controlFocus('--sys-anchor-focus', solidUnderline);

type Props = Pick<
  t.Anchor.Props,
  'theme' | 'mono' | 'style' | 'truncate' | 'enabled' | 'disabledOpacity'
>;

const truncation: t.CssValue = {
  display: 'inline-block',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};

/** Share appearance without imposing one element's activation behavior on the other. */
export function linkAppearance(props: Props, reset?: t.CssValue) {
  const enabled = props.enabled ?? D.enabled;
  const theme = Color.theme(props.theme);
  const underline = Color.alpha(theme.fg, theme.is.dark ? 0.35 : 0.25);
  const opacity = props.disabledOpacity === false
    ? undefined
    : props.disabledOpacity ?? D.disabledOpacity;
  const base = css({
    color: 'inherit',
    fontFamily: (props.mono ?? D.mono) ? 'monospace' : undefined,
    ...(enabled
      ? {
        textDecoration: `underline dashed ${underline}`,
        textUnderlinePosition: 'under',
        transition: 'text-decoration-color 100ms ease',
        ':hover': solidUnderline,
        ':active': { transform: 'translateY(1px)' },
      }
      : { textDecoration: 'none', opacity, cursor: 'default' }),
  });
  const styles = [reset, base, (props.truncate ?? D.truncate) && truncation];
  return enabled
    ? focus(styles, props.style)
    : { class: css(styles, props.style).class, compact: false };
}
