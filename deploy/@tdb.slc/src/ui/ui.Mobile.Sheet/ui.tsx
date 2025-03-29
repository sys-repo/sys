import React from 'react';
import { type t, Color, css, DEFAULTS as D, M } from './common.ts';

export const MobileSheet: React.FC<t.MobileSheetProps> = (props) => {
  const { duration = D.duration, radius = D.radius } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      backgroundColor: theme.bg,
      display: 'grid',
      borderRadius: `${radius}px ${radius}px 0 0`,
    }),
    mask: css({
      // NB: Extends the sheet to ensure the physics bounce does not show a flash.
      //     Ensure this component is within a container with { overflow: 'hidden' }.
      Absolute: [null, 0, -30, 0],
      height: 30,
      backgroundColor: theme.bg,
    }),
  };

  return (
    <M.div
      className={css(styles.base, props.style).class}
      initial={{ y: '100%' }} // Offscreen (bottom).
      animate={{ y: '0%' }} //   Slide into view.
      exit={{ y: '100%' }} //    Slide out when unmounting ← (inside <AnimatePresence>)
      transition={{ duration, type: 'spring', bounce: 0.2 }}
      onClick={props.onClick}
      onMouseDown={props.onMouseEnter}
      onMouseUp={props.onMouseUp}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      <div className={styles.mask.class} />
      {props.children}
    </M.div>
  );
};
