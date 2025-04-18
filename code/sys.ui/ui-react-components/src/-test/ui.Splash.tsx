import React from 'react';
import { type t, Color, css } from './common.ts';

import { useKeyboard } from '@sys/ui-react-devharness';

export type SplashProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Splash: React.FC<SplashProps> = (props) => {
  const href = '?dev';
  useKeyboard();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      fontFamily: 'sans-serif',
      display: 'grid',
      placeItems: 'center',
      color: theme.fg,
    }),
    a: css({
      textDecoration: 'none',
      fontSize: 30,
      color: Color.BLUE,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <a href={href} className={styles.a.class}>{`🐷 ${href}`}</a>
    </div>
  );
};
