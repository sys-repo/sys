import React from 'react';
import { type t, Color, css, D, M } from './common.ts';

type P = GridLayoutProps;
type C = t.ConceptPlayerColumn;

/**
 * Props
 */
export type GridLayoutProps = {
  debug?: boolean;
  column?: t.ConceptPlayerColumn;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const GridLayout: React.FC<P> = (props) => {
  const { debug = false } = props;
  const column = wrangle.main(props.column);
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
 * Helpers
 */
const wrangle = {
  main(main?: C): Required<Omit<C, 'children'>> {
    return { ...D.column, ...main };
  },

  gridTemplateColumns(main: C) {
    const props = wrangle.main(main);
    const width = props.width;
    const W = `${width}px`;
    if (main.align === 'Left') return `0px ${W} 1fr`;
    if (main.align === 'Right') return `1fr ${W} 0px`;
    return `1fr ${W} 1fr`;
  },
} as const;
