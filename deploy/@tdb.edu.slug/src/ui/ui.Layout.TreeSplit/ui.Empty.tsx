import React from 'react';
import { type t, Color, css } from './common.ts';

export type EmptyProps = {
  children?: t.ReactNode;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Empty: React.FC<EmptyProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      opacity: 0.3,
      fontSize: 13,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return <div className={css(styles.base, props.style).class}>{props.children}</div>;
};
