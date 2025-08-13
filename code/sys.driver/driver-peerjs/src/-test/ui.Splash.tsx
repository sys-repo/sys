import React, { useEffect, useRef, useState } from 'react';
import { type t, pkg, Color, css, Cropmarks, ObjectView, Signal, rx } from './common.ts';

export type SplashProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Splash: React.FC<SplashProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({
      Absolute: 0,
      backgroundColor: theme.bg,
      fontFamily: 'sans-serif',
      color: theme.fg,
      display: 'grid',
    }),
    body: css({ padding: 15 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.05}>
        <div className={styles.body.class}>
          <ObjectView name={'splash'} data={pkg} expand={1} theme={theme.name} />
        </div>
      </Cropmarks>
    </div>
  );
};
