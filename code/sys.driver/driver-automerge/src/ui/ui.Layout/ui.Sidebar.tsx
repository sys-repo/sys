import React from 'react';
import { type t, Color, css, D, ErrorBoundary, Is } from './common.ts';
import { renderCtx, toSidebarConfig } from './u.ts';
import { Spinner } from './ui.Spinner.tsx';

type P = t.LayoutProps;

/**
 * Component:
 */
export const Sidebar: React.FC<P> = (props) => {
  const { debug = false, slots, spinning } = props;
  const config = toSidebarConfig(props.sidebar);
  const render = renderCtx(props);
  const isSpinning = Is.record(spinning) && spinning.sidebar === true;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      width: 'auto',
      borderLeft: 'none',
      borderRight: 'none',
      display: 'grid',
      minWidth: 0,
      minHeight: 0,
    }),
    body: css({
      position: 'relative',
      boxSizing: 'border-box',
      opacity: isSpinning || !render.ready ? 0 : 1,
      transition: D.spinningTransition,
      display: 'grid',
    }),
    empty: css({
      padding: 10,
      backgroundColor: Color.ruby(),
    }),
  };

  const elBody = render.ready ? slots?.sidebar?.(render.ctx) : null;

  return (
    <div className={css(styles.base, props.style).class}>
      <ErrorBoundary theme={theme.name}>
        <div className={styles.body.class}>{elBody}</div>
        {isSpinning && <Spinner theme={theme.name} />}
      </ErrorBoundary>
    </div>
  );
};
