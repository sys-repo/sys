/**
 * Minimal starter entry view.
 * Keeps the default template fast and shows the basic `@sys/ui-css` shape
 * without pulling in richer optional UI/dev layers.
 */
import React from 'react';

import type * as t from '@sys/types';
import { Color, css } from '@sys/ui-css';
import { Button } from './common.ts';
import { HttpOrigin } from '../ui/mod.ts';

export type SplashProps = { theme?: t.CommonTheme };

export const Splash: React.FC<SplashProps> = (props) => {
  const {} = props;

  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({ Absolute: 0, backgroundColor: theme.bg, color: theme.fg }),
    center: css({ display: 'grid', placeItems: 'center' }),
    body: css({
      width: 420,
      display: 'grid',
      rowGap: 30,
    }),
  };

  return (
    <div className={css(styles.base, styles.center).class}>
      <div className={styles.body.class}>
        <HttpOrigin.UI theme={theme.name} />
        <Button theme={theme.name} label={'verify:🐷'} enabled={false} />
      </div>
    </div>
  );
};
