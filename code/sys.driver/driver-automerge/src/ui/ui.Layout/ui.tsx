import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { renderCtx } from './u.ts';
import { Body } from './ui.Body.tsx';
import { Spinner } from './ui.Spinner.tsx';

type P = t.CrdtLayoutProps;

export const CrdtLayout: React.FC<P> = (props) => {
  const { debug = false, spinning } = props;
  const isSpinning = spinning === true;
  const render = renderCtx(props);

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
      pointerEvents: isSpinning ? 'none' : 'auto',
      opacity: isSpinning || !render.ready ? 0 : 1,
      transition: D.spinningTransition,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Body {...props} style={styles.body} />
      {isSpinning || (!render.ready && <Spinner theme={theme.name} />)}
    </div>
  );
};
