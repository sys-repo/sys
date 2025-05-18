import React from 'react';
import { type t, Color, css } from './common.ts';

export type HrProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Hr: React.FC<HrProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      border: `dashed 1px ${Color.alpha(theme.fg, 0.1)}`,
      pointerEvents: 'none',
    }),
  };

  return <div className={css(styles.base, props.style).class}></div>;
};
