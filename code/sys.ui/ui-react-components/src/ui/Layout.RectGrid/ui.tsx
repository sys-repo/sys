import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const RectGrid: React.FC<t.RectGridProps> = (props) => {
  const {
    debug = false,
    style,
    items = [],
    aspectRatio = D.aspectRatio,
    minColumnWidth = D.minColumnWidth,
    gap = D.gap,
  } = props;

  const count = items.length;

  /**
   * Active index:
   * - Defaults to D.activeIndex.
   * - Clamped into the [0, count - 1] range when items exist.
   * - Set to -1 when there are no items.
   */
  let activeIndex = props.activeIndex ?? D.activeIndex;
  if (count === 0) {
    activeIndex = -1;
  } else {
    if (activeIndex < 0) activeIndex = 0;
    if (activeIndex > count - 1) activeIndex = count - 1;
  }

  /**
   * Styles:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
      gap,
      alignContent: 'start',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),

    empty: css({
      gridColumn: '1 / -1',
      padding: 10,
      fontSize: 12,
      opacity: 0.7,
    }),

    cell: css({
      position: 'relative',
      width: '100%',
      aspectRatio,
      overflow: 'hidden',
      borderRadius: 12,
    }),

    cellInner: css({
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      display: 'grid',
    }),
  };

  const elEmpty = count === 0 && <div className={styles.empty.class}>{'No items to display'}</div>;

  /**
   * Render:
   */
  return (
    <div className={css(styles.base, style).class}>
      {elEmpty}

      {items.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <div key={item.id} className={styles.cell.class} style={{ opacity: isActive ? 1 : 0.6 }}>
            <div className={styles.cellInner.class}>{item.render()}</div>
          </div>
        );
      })}
    </div>
  );
};
