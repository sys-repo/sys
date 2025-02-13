import { Color, css, type t } from '../common.ts';

export type FooterProps = {
  enabled?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * NOTE:
 *    Acts as a spacer for the bottom of the list for scrolling.
 */
export const Footer: React.FC<FooterProps> = (props) => {
  const color = Color.theme(props.theme).fg;
  const styles = {
    base: css({ height: 80, color }),
  };
  return <div className={css(styles.base, props.style).class}></div>;
};
