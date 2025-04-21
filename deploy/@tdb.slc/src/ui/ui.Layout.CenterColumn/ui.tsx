import React from 'react';
import { type t, Color, css, D, M } from './common.ts';

type P = t.LayoutCenterColumnProps;

export const LayoutCenterColumn: React.FC<P> = (props) => {
  const { debug = false, gap = D.gap, centerWidth = D.center.width } = props;

  /**
   * Styles:
   */
  const gridTemplateColumns = wrangle.gridTemplateColumns(props);
  const styles = {
    base: css({ position: 'relative', display: 'grid' }),
    section: css({
      display: 'grid',
      gridTemplateColumns,
      columnGap: `${gap}px`,
    }),
    column: css({
      backgroundColor: !debug ? undefined : Color.RUBY,
      width: centerWidth,
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
          {props.center}
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
  gridTemplateColumns(props: P) {
    const { centerWidth = D.center.width, align = D.center.align } = props;
    const W = `${centerWidth}px`;
    if (align === 'Left') return `0px ${W} 1fr`;
    if (align === 'Right') return `1fr ${W} 0px`;
    return `1fr ${W} 1fr`;
  },
} as const;
