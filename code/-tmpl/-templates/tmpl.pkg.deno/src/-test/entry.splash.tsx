/**
 * Minimal starter entry view.
 * Keeps the default template fast and shows the basic `@sys/ui-css` shape
 * without pulling in richer optional UI/dev layers.
 */
import React from 'react';
import { css, Color } from '@sys/ui-css';
import type * as t from '@sys/types';

export type SplashProps = { theme?: t.CommonTheme };

export const Splash: React.FC<SplashProps> = (props) => {
  const {} = props;

  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({ Absolute: 0, backgroundColor: theme.bg, color: theme.fg }),
    center: css({ display: 'grid', placeItems: 'center' }),
    body: css({ fontSize: 32, fontFamily: 'system-ui' }),
  };

  return (
    <div className={css(styles.base, styles.center).class}>
      <div className={styles.body.class}>{`👋 Hello World`}</div>
    </div>
  );
};
