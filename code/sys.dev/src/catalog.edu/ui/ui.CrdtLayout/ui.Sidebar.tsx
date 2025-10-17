import React from 'react';
import { type t, Color, css } from './common.ts';
import { edgeBorder, sidebarConfig } from './u.ts';

type P = t.CrdtLayoutProps;

/**
 * Component:
 */
export const Sidebar: React.FC<P> = (props) => {
  const { debug = false, signals = {} } = props;
  const config = sidebarConfig(props.sidebar);

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
    body: css({
      boxSizing: 'border-box',
      padding: 10,
      paddingTop: 20,
    }),
  };

    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>🐷 Sidebar</div>
    </div>
  );
};
