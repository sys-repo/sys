import React from 'react';
import { type t, Color, css, D, M } from './common.ts';

type P = t.LayoutHGridProps;
type C = t.HGridColumn;

export const LayoutHGrid: React.FC<P> = (props) => {
  const { debug = false } = props;
  const column = wrangle.column(props.column);
  const spring = { type: 'spring' as const, stiffness: 600, damping: 35 };
  const tween = { type: 'tween' as const, ease: 'easeOut', duration: 0.1 };

  /**
   * Styles:
   */
  const gridTemplateColumns = wrangle.gridTemplateColumns(column);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    section: css({ display: 'grid', gridTemplateColumns, gap: column.gap }),
    column: css({
      backgroundColor: !debug ? undefined : Color.RUBY,
      width: column.width,
      display: 'grid',
    }),
  };

  /**
   * Render:
   */
  return (
    <div className={css(styles.base, props.style).class}>
      <M.section layout transition={{ layout: spring }} className={styles.section.class}>
        <M.div layout />

        <M.div
          layout
          className={styles.column.class}
          animate={{ marginTop: column.marginTop }}
          transition={{ layout: spring, marginTop: tween }}
        >
          {props.column?.children}
        </M.div>

        <M.div layout />
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
