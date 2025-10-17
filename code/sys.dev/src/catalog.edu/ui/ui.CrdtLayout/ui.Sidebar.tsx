import React from 'react';
import { type t, Color, css } from './common.ts';
import { edgeBorder, sidebarConfig, slotCtx } from './u.ts';

type P = t.CrdtLayoutProps;

/**
 * Component:
 */
export const Sidebar: React.FC<P> = (props) => {
  const { debug = false, signals = {}, slots } = props;
  const config = sidebarConfig(props.sidebar);
  const ctx = slotCtx(props);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      borderLeft: config.position === 'right' ? edgeBorder(theme) : undefined,
      borderRight: config.position === 'left' ? edgeBorder(theme) : undefined,
      width: config.width,
      display: 'grid',
    }),
    body: css({ position: 'relative', boxSizing: 'border-box', display: 'grid' }),
    empty: css({ padding: 10, backgroundColor: Color.ruby() }),
  };

  const elEmpty = <div className={styles.empty.class}>{'🐷 slot:sidebar'}</div>;
  const el = slots?.sidebar?.(ctx);

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{el ?? elEmpty}</div>
    </div>
  );
};
