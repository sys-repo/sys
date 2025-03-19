import React, { useEffect } from 'react';
import { type t, Color, css, Keyboard, rx } from './common.ts';

export type SplashProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Splash: React.FC<SplashProps> = (props) => {
  const href = '?dev';

  useEffect(() => {
    const life = rx.disposable();
    const keyboard = Keyboard.until(life.dispose$);
    keyboard.on('Enter', () => (window.location.search = href));
    return life.dispose;
  });

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
