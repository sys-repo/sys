import React from 'react';

import { type t, Color, css, Spinners } from './common.ts';
import { Body } from './ui.Body.tsx';

type P = t.CrdtLayoutProps;

export const CrdtLayout: React.FC<P> = (props) => {
  const { debug = false, spinning = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      minHeight: 0,
    }),
    body: css({
      pointerEvents: spinning ? 'none' : 'auto',
      opacity: spinning ? 0 : 1,
      transition: 'opacity 80ms ease',
    }),
    spinning: css({
      Absolute: 0,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Body {...props} style={styles.body} />
      {spinning && (
        <div className={styles.spinning.class}>
          <Spinners.Bar theme={theme.name} />
        </div>
      )}
    </div>
  );
};
