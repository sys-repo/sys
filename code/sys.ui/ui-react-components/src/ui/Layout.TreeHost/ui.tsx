import React from 'react';
import { type t, Color, css, D, M } from './common.ts';
import { Nav } from './ui.Nav.tsx';
import { Main } from './ui.slot.Main.tsx';
import { SlotHost } from './ui.SlotHost.tsx';

export const TreeHost: React.FC<t.TreeHostProps> = (props) => {
  const theme = Color.theme(props.theme);
  const nav = { ...D.nav, ...props.nav, animate: { ...D.nav.animate, ...props.nav?.animate } };
  const navWidth = nav.width;
  const navVisible = navWidth > 0;
  const navTransition = { duration: nav.animate.duration / 1000, ease: nav.animate.ease } as const;

  const styles = {
    base: css({
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: 'auto auto minmax(0, 1fr)',
    }),
    border: css({ backgroundColor: Color.alpha(theme.fg, 0.1) }),
    nav: {
      track: css({ minWidth: 0, minHeight: 0, display: 'grid', overflow: 'hidden' }),
      slide: css({ display: 'grid' }),
      panel: css({ minHeight: 0 }),
    },
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <M.div
        className={styles.nav.track.class}
        initial={false}
        animate={{ width: navWidth }}
        transition={navTransition}
        style={{ pointerEvents: navVisible ? 'auto' : 'none' }}
      >
        <M.div
          initial={false}
          animate={{ x: navVisible ? 0 : -24 }}
          transition={navTransition}
          className={styles.nav.slide.class}
        >
          <Nav {...props} style={styles.nav.panel} />
        </M.div>
      </M.div>
      <M.div
        className={styles.border.class}
        initial={false}
        animate={{ width: navVisible ? 1 : 0 }}
        transition={navTransition}
      />
      <SlotHost host={props} slot={'main'}>
        <Main {...props} />
      </SlotHost>
    </div>
  );
};
