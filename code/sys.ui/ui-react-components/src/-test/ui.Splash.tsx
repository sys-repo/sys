import { useKeyboard } from '@sys/ui-react-devharness';
import React from 'react';

import { type t, Color, css } from './common.ts';

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
    base: css({ color: theme.fg, fontFamily: 'sans-serif', display: 'grid', placeItems: 'center' }),
    icon: css({ fontSize: 64, userSelect: 'none' }),
    a: css({ fontSize: 30, color: Color.BLUE, textDecoration: 'none' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>
        <div className={styles.icon.class}>{'🐦‍⬛'}</div>
        <a href={href} className={styles.a.class}>{`${href}`}</a>
      </div>
    </div>
  );
};
