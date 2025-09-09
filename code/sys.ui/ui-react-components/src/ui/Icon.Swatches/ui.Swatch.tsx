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
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: theme.alpha(0.5).bg,
      boxShadow: `0 2px 25px 0 ${Color.format(-0.2)}`,
      color: theme.fg,
      display: 'grid',
      aspectRatio: '1 / 1',
      borderRadius: 8,
    }),
    body: css({
      display: 'grid',
      gridTemplateRows: `1fr auto`,
    }),
    icon: {
      outer: css({
        display: 'grid',
        placeItems: 'center',
      }),
    },

    footer: css({ padding: 15 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.icon.outer.class}>
          <Icons.Face size={120} />
        </div>
        <div className={styles.footer.class}>Footer</div>
      </div>
    </div>
  );
};
