import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, DEFAULTS, rx } from './common.ts';

import { Icons } from '../ui.Icons.ts';

export type SwatchProps = {
  iconSize?: t.Pixels;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Swatch: React.FC<SwatchProps> = (props) => {
  const { iconSize = 120 } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: theme.alpha(0.5).bg,
      color: theme.fg,
      borderRadius: 8,
      boxShadow: `0 2px 25px 0 ${Color.format(-0.2)}`,
      minWidth: 120,
      display: 'grid',
    }),
    body: css({ display: 'grid', gridTemplateRows: `1fr auto`, aspectRatio: '1 / 1' }),
    icon: css({ display: 'grid', placeItems: 'center', padding: 10 }),
    footer: css({ fontSize: 11, padding: 15 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.icon.class}>
          <Icons.Face size={iconSize} />
        </div>
        <div className={styles.footer.class}>Footer</div>
      </div>
    </div>
  );
};
