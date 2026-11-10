import { Color, css, type t } from '../common.ts';

/** Decorative section break for dev specimens, including their horizontal overhang. */
export const DevDivider = (props: t.Dev.Divider.Props) => {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Margin: [14, -25, 10, -25],
      height: 5,
      backgroundColor: Color.alpha(theme.fg, 0.1),
      pointerEvents: 'none',
    }),
  };
  return <div aria-hidden='true' className={css(styles.base, props.style).class} />;
};
