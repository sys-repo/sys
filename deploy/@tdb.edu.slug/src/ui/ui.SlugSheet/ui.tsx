import React from 'react';
import { type t, Color, css, D, Num, Sheet } from './common.ts';

type P = t.SlugSheetProps;

export const SlugSheet: React.FC<P> = (props) => {
  const { slots = {}, debug = false } = props;
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

  const elSheet = !isRoot && (
    <Sheet.UI
      theme={theme.name}
      orientation={'Bottom:Up'}
      radius={radius}
      shadowOpacity={wrangle.shadowOpacity(props, theme)}
      edgeMargin={isRoot ? undefined : [10, '1fr', 10]}
    >
      <div className={styles.main.class}>{slots.main}</div>
      <div className={styles.border.class} />
    </Sheet.UI>
  );

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {elRoot || elSheet}
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

  isRoot(props: P) {
    return wrangle.index(props) === 0;
  },

  borderColor(props: P, theme = Color.theme(props.theme)) {
    const isRoot = wrangle.isRoot(props);
    if (isRoot) return Color.TRANSPARENT;
    return Color.alpha(theme.fg, theme.is.dark ? 0.1 : 0.2);
  },

  shadowOpacity(props: P, theme = Color.theme(props.theme)) {
    if (wrangle.isRoot(props)) return 0;
    return props.shadowOpacity ?? (theme.is.dark ? -0.32 : -0.06);
  },
} as const;
