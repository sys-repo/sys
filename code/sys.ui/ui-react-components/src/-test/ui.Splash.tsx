import React from 'react';

import { useKeyboard } from '@sys/ui-react-devharness';
import { type t, Color, css, pkg } from './common.ts';
import { KeyValue } from '../ui/KeyValue/mod.ts';

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
      color: theme.fg,
      fontFamily: 'sans-serif',
      display: 'grid',
      placeItems: 'center',
    }),
    link: css({
      color: 'inherit',
      textDecoration: 'none',
      display: 'block',
      cursor: 'pointer',
    }),
    body: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 5,
      marginBottom: 30,
    }),
    title: css({
      fontSize: 30,
      color: Color.BLUE,
    }),
    titleDev: css({
      textDecorationLine: 'underline',
      textDecorationStyle: 'dashed',
      textDecorationColor: Color.alpha(theme.fg, 0.2),
      textDecorationThickness: '1px',
      textUnderlineOffset: '5px',
      transition: 'text-decoration-color 100ms ease, text-decoration-style 100ms ease',
      ':hover': {
        textDecorationStyle: 'solid',
        textDecorationColor: 'currentColor',
      },
      ':focus-visible': {
        textDecorationStyle: 'solid',
        textDecorationColor: 'currentColor',
      },
    }),
    qs: css({
      color: Color.alpha(theme.fg, 0.2),
      marginRight: 2,
      textDecoration: 'none',
    }),
    info: {
      base: css({ position: 'relative', marginLeft: 19 }),
      traceline: css({
        Absolute: [-55, null, -80, 0],
        width: 1,
        backgroundColor: Color.alpha(theme.fg, 0.03),
      }),
    },
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <a href={href} className={styles.link.class}>
        <div className={styles.body.class}>
          <div className={styles.title.class}>
            <span className={styles.qs.class}>{'?'}</span>
            <span className={styles.titleDev.class}>{'dev'}</span>
          </div>
          <div className={styles.info.base.class}>
            <div className={styles.info.traceline.class} />
            <KeyValue.UI
              theme={theme.name}
              items={[
                { k: 'pkg', v: pkg.name },
                { k: 'version', v: pkg.version },
              ]}
            />
          </div>
        </div>
      </a>
    </div>
  );
};
