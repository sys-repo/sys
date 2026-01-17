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
      color: Color.alpha(theme.fg, 0.3),
      fontSize: 13,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({ padding: 30 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{props.children}</div>
    </div>
  );
};
