/**
 * Minimal starter entry view.
 * Keeps the default template fast and shows the basic `@sys/ui-css` shape
 * without pulling in richer optional UI/dev layers.
 */
import React from 'react';

import type * as t from '@sys/types';
import { Color, css } from '@sys/ui-css';
import { Keyboard } from '@sys/ui-dom';
import { HttpOrigin } from '../ui/ui.HttpOrigin/mod.ts';

export type SplashProps = { theme?: t.CommonTheme };

const D = {
  storage: 'dev:@tdb/slc-data:entry.splash:HttpOrigin',
} as const;

export const Splash: React.FC<SplashProps> = (props) => {
  useSplashKeyboard();
  const state = HttpOrigin.use.Controller(D.storage);

  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({ Absolute: 0, backgroundColor: theme.bg, color: theme.fg }),
    center: css({ display: 'grid', placeItems: 'center' }),
    body: css({ width: 460, display: 'grid', rowGap: 30 }),
  };

  return (
    <div className={css(styles.base, styles.center).class}>
      <div className={styles.body.class}>
        <HttpOrigin.UI.Controlled
          env={state.env}
          theme={theme.name}
          verify={HttpOrigin.Default.verify}
        />
      </div>
    </div>
  );
};

/**
 * Helpers:
 */
function useSplashKeyboard() {
  React.useEffect(() => {
    const keyboard = Keyboard.until();

    keyboard.on('CMD + Enter', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('dev', 'true');
      window.location.href = url.href;
    });

    return keyboard.dispose;
  }, []);
}
