import React from 'react';

import { type t, Color, css } from './common.ts';
import { toSidebarConfig } from './u.ts';
import { Footer } from './ui.Footer.tsx';
import { Header } from './ui.Header.tsx';
import { Main } from './ui.Main.tsx';
import { Sidebar } from './ui.Sidebar.tsx';

type P = t.CrdtLayoutProps;

export const Body: React.FC<P> = (props) => {
  const { debug = false } = props;
  const sidebar = toSidebarConfig(props.sidebar);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const [colLeft, colRight] = wrangle.cols(props);

  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      minHeight: 0,
    }),

    body: css({
      display: 'grid',
      gridTemplateColumns: sidebar.position === 'left' ? `${colLeft} 1fr` : `1fr ${colRight}`,
      minHeight: 0,
      overflow: 'hidden',
    }),

    main: css({ minWidth: 0, minHeight: 0 }),
    sidebar: css({
      // NB: Always mounted; visually hidden + non-interactive when not visible.
      opacity: sidebar.visible ? 1 : 0,
      visibility: sidebar.visible ? 'visible' : 'hidden',
      pointerEvents: sidebar.visible ? 'auto' : 'none',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Header {...props} />

      <div className={styles.body.class}>
        {sidebar.position === 'left' && <Sidebar {...props} style={styles.sidebar} />}
        <Main {...props} style={styles.main} />
        {sidebar.position === 'right' && <Sidebar {...props} style={styles.sidebar} />}
      </div>

      <Footer {...props} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  cols(props: P) {
    const sidebar = toSidebarConfig(props.sidebar);
    const { width, visible, position } = sidebar;
    const left = sidebar.position === 'left' ? (visible ? `${width}px` : '0px') : '1fr';
    const right = position === 'right' ? (visible ? `${width}px` : '0px') : 'auto';
    return [left, right] as const;
  },
} as const;
