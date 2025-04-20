import React from 'react';
import { type t, Color, css, D, M } from './common.ts';

type P = t.LayoutHGridProps;
type C = t.HGridColumn;

export const LayoutHGrid: React.FC<P> = (props) => {
  const { debug = false, gap = D.gap } = props;
  const column = wrangle.column(props.column);

  /**
   * Styles:
   */
  const gridTemplateColumns = wrangle.gridTemplateColumns(column);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    section: css({
      display: 'grid',
      gridTemplateColumns,
      columnGap: `${gap}px`,
    }),
    column: css({
      backgroundColor: !debug ? undefined : Color.RUBY,
      width: column.width,
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
  const layout = { type: 'spring' as const, stiffness: 600, damping: 35 };
  return (
    <div className={css(styles.base, props.style).class}>
      <M.section layout transition={{ layout }} className={styles.section.class}>
        <M.div layout transition={{ layout }} className={css(styles.edge, styles.left).class}>
          {props.left}
        </M.div>

        <M.div layout transition={{ layout }} className={styles.column.class}>
          {props.column?.children}
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
  column(prop?: P['column']): Required<Omit<C, 'children'>> {
    return { ...D.column, ...prop };
  },

  gridTemplateColumns(prop: C) {
    const props = wrangle.column(prop);
    const width = props.width;
    const W = `${width}px`;
    if (prop.align === 'Left') return `0px ${W} 1fr`;
    if (prop.align === 'Right') return `1fr ${W} 0px`;
    return `1fr ${W} 1fr`;
  },
} as const;
