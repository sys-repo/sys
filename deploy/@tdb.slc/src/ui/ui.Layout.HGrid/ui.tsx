import React from 'react';
import { type t, Color, css, D, M } from './common.ts';

type P = t.LayoutHGridProps;
type C = t.HGridColumn;

export const LayoutHGrid: React.FC<P> = (props) => {
  const { debug = false, gap = D.gap } = props;
  const center = wrangle.center(props.center);

  /**
   * Styles:
   */
  const gridTemplateColumns = wrangle.gridTemplateColumns(center);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    section: css({
      display: 'grid',
      gridTemplateColumns,
      columnGap: `${gap}px`,
    }),
    column: css({
      backgroundColor: !debug ? undefined : Color.RUBY,
      width: center.width,
      zIndex: 1,
      display: 'grid',
    }),

    edge: css({ display: 'grid', zIndex: 0, overflow: 'hidden' }),
    left: css({}),
    right: css({}),
  };

  /**
   * Render:
   */
  const layout = { type: 'spring' as const, stiffness: 600, damping: 36 };
  return (
    <div className={css(styles.base, props.style).class}>
      <M.section layout transition={{ layout }} className={styles.section.class}>
        <M.div layout transition={{ layout }} className={css(styles.edge, styles.left).class}>
          {props.left}
        </M.div>

        <M.div layout transition={{ layout }} className={styles.column.class}>
          {props.center?.children}
        </M.div>

        <M.div layout transition={{ layout }} className={css(styles.edge, styles.right).class}>
          {props.right}
        </M.div>
      </M.section>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  center(prop?: P['center']): Required<Omit<C, 'children'>> {
    return { ...D.center, ...prop };
  },

  gridTemplateColumns(prop: C) {
    const props = wrangle.center(prop);
    const width = props.width;
    const W = `${width}px`;
    if (prop.align === 'Left') return `0px ${W} 1fr`;
    if (prop.align === 'Right') return `1fr ${W} 0px`;
    return `1fr ${W} 1fr`;
  },
} as const;
