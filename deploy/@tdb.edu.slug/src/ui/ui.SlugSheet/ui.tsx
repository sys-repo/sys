import React from 'react';
import { type t, AnimatePresence, Color, css, D, Num, Sheet } from './common.ts';

type P = t.SlugSheetProps;

export const SlugSheet: React.FC<P> = (props) => {
  const { slots = {}, debug = false, visible = D.visible } = props;
  const index = wrangle.index(props);
  const isRoot = index === 0;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const border = `solid 1px ${wrangle.borderColor(props, theme)}`;
  const radius = isRoot ? 0 : 6;
  const borderRadius = `${radius}px ${radius}px 0 0`;
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    main: css({
      Absolute: 0,
      borderRadius,
      backgroundColor: theme.bg,
      display: 'grid',
    }),
    border: css({
      Absolute: 0,
      borderTop: border,
      borderRight: border,
      borderLeft: border,
      pointerEvents: 'none',
      borderRadius,
    }),
  };

  const elRoot = isRoot && <div className={styles.main.class}>{slots.main}</div>;

  const elSheet = !isRoot && visible && (
    <Sheet.UI
      theme={theme.name}
      orientation={'Bottom:Up'}
      radius={radius}
      shadowOpacity={isRoot ? 0 : -0.06}
      edgeMargin={isRoot ? undefined : [10, '1fr', 10]}
    >
      <div className={styles.main.class}>{slots.main}</div>
      <div className={styles.border.class} />
    </Sheet.UI>
  );

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <AnimatePresence>{elRoot || elSheet}</AnimatePresence>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  index(props: P) {
    return Num.clamp(0, Num.MAX_INT, props.index ?? D.index);
  },

  borderColor(props: P, theme = Color.theme(props.theme)) {
    const index = wrangle.index(props);
    if (index === 0) return Color.TRANSPARENT;
    return theme.is.dark ? Color.alpha(Color.BLACK, 0.3) : Color.alpha(theme.fg, 0.2);
  },
} as const;
