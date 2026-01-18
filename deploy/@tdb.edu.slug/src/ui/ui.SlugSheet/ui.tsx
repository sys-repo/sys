import React from 'react';
import { type t, AnimatePresence, Color, css, D, Sheet } from './common.ts';

export const SlugSheet: React.FC<t.SlugSheetProps> = (props) => {
  const { slots = {}, debug = false, visible = D.visible, index = D.index } = props;
  const isRoot = index === 0;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const radius = isRoot ? 0 : 6;
  const border = `solid 1px ${Color.alpha(theme.fg, isRoot ? 0 : 0.2)}`;
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    main: css({
      Absolute: 0,
      display: 'grid',
    }),
    border: css({
      Absolute: 0,
      borderTop: border,
      borderRight: border,
      borderLeft: border,
      pointerEvents: 'none',
      borderRadius: `${radius}px ${radius}px 0 0`,
    }),
  };

  const elSheet = visible && (
    <Sheet.UI
      theme={theme.name}
      orientation={'Bottom:Up'}
      radius={radius}
      shadowOpacity={isRoot ? 0 : -0.06}
    >
      <div className={styles.main.class}>{slots.main}</div>
      <div className={styles.border.class} />
    </Sheet.UI>
  );

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <AnimatePresence>{elSheet}</AnimatePresence>
    </div>
  );
};
