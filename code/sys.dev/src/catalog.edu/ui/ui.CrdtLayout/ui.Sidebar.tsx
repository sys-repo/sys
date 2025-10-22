import React from 'react';
import { type t, Color, css, D, Is } from './common.ts';
import { edgeBorder, renderCtx, toSidebarConfig } from './u.ts';
import { Spinner } from './ui.Spinner.tsx';

type P = t.CrdtLayoutProps;

/**
 * Component:
 */
export const Sidebar: React.FC<P> = (props) => {
  const { debug = false, crdt, slots, spinning } = props;
  const config = toSidebarConfig(props.sidebar);
  const render = renderCtx(props);
  const isSpinning = Is.record(spinning) && spinning.sidebar === true;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      borderLeft: config.position === 'right' ? edgeBorder(theme) : undefined,
      borderRight: config.position === 'left' ? edgeBorder(theme) : undefined,
      width: config.width,
      display: 'grid',
    }),
    body: css({
      position: 'relative',
      boxSizing: 'border-box',
      opacity: isSpinning ? 0 : 1,
      transition: D.spinningTransition,
      display: 'grid',
    }),
    empty: css({ padding: 10, backgroundColor: Color.ruby() }),
  };

  const elEmpty = <div className={styles.empty.class}>{'🐷 slot: sidebar'}</div>;
  const el = render.ready ? slots?.sidebar?.(render.ctx) : null;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{el ?? elEmpty}</div>
      {isSpinning && <Spinner theme={theme.name} />}
    </div>
  );
};
