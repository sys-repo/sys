import React from 'react';
import { type t, Color, css, D, Is, M } from './common.ts';
import { resolveParts } from './u.parts.ts';
import { toSlotNode } from './u.slot.ts';
import { Nav } from './ui.Nav.tsx';
import { Footer } from './ui.slot.Footer.tsx';
import { Header } from './ui.slot.Header.tsx';
import { Main } from './ui.slot.Main.tsx';
import { SlotHost } from './ui.SlotHost.tsx';

export const TreeHost: React.FC<t.TreeHost.Props> = (props) => {
  const { slots = {} } = props;
  const theme = Color.theme(props.theme);
  const parts = resolveParts(props);
  const nav = { ...D.nav, ...props.nav, animate: { ...D.nav.animate, ...props.nav?.animate } };
  const navWidth = nav.width;
  const navVisible = navWidth > 0;
  const navTransition = wrangle.navTransition(parts.nav.motion.transition, navWidth);
  // Resolve once so row presence derives from rendered output and renderers are not double-invoked.
  const headerNode = toSlotNode(slots.header?.body, { slot: 'header:body' });
  const footerNode = toSlotNode(slots.footer?.body, { slot: 'footer:body' });
  const hasHeader = headerNode != null;
  const hasFooter = footerNode != null;
  const rows = [
    hasHeader ? 'auto' : undefined,
    'minmax(0, 1fr)',
    hasFooter ? 'auto' : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  const styles = {
    base: css({
      minWidth: 0,
      minHeight: 0,
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: rows,
    }),
    middle: css({
      minWidth: 0,
      minHeight: 0,
      display: 'grid',
      gridTemplateColumns: 'auto auto minmax(0, 1fr)',
    }),
    border: css({ backgroundColor: Color.alpha(theme.fg, 0.1) }),
    header: {
      panel: css({ backgroundColor: parts.header.backgroundColor }),
    },
    footer: {
      panel: css({ backgroundColor: parts.footer.backgroundColor }),
    },
    nav: {
      track: css({ minWidth: 0, minHeight: 0, display: 'grid', overflow: 'hidden' }),
      slide: css({ display: 'grid' }),
      panel: css({ minHeight: 0 }),
    },
  };

  const elHeader = hasHeader && (
    <SlotHost host={props} slot={'header:body'}>
      <Header theme={props.theme} style={styles.header.panel}>
        {headerNode}
      </Header>
    </SlotHost>
  );

  const elFooter = hasFooter && (
    <SlotHost host={props} slot={'footer:body'}>
      <Footer theme={props.theme} style={styles.footer.panel}>
        {footerNode}
      </Footer>
    </SlotHost>
  );

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {elHeader}
      <div className={styles.middle.class}>
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
        <SlotHost host={props} slot={'main:body'}>
          <Main {...props} />
        </SlotHost>
      </div>
      {elFooter}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  navTransition(
    transition: ReturnType<typeof resolveParts>['nav']['motion']['transition'],
    width: number,
  ): ReturnType<typeof resolveParts>['nav']['motion']['transition'] {
    if (width > 0) return transition;
    if (!('type' in transition && Is.str(transition.type) && transition.type === 'spring')) {
      return transition;
    }
    return {
      ...transition,
      bounce: 0,
      damping: Math.max(transition.damping, 48),
    };
  },
} as const;
