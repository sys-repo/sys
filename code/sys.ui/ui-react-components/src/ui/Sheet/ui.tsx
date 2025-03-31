import React from 'react';
import { type t, Color, css, DEFAULTS as D, M } from './common.ts';

export const Sheet: React.FC<t.SheetProps> = (props) => {
  const {
    direction = D.direction,
    duration = D.duration,
    radius = D.radius,
    bounce = D.bounce,
  } = props;

  const isTopDown = direction === 'Top:Down';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      pointerEvents: 'auto',
      color: theme.fg,
      backgroundColor: theme.bg,
      display: 'grid',
      borderRadius: isTopDown ? `0 0 ${radius}px ${radius}px` : `${radius}px ${radius}px 0 0`,
      boxShadow: isTopDown
        ? `0 5px 6px 0 ${Color.format(props.shadowOpacity ?? -0.15)}`
        : `0 -5px 6px 0 ${Color.format(props.shadowOpacity ?? -0.15)}`,
    }),
    mask: css({
      // NB: Extends the sheet to ensure the physics bounce does not show a flash.
      //     Ensure this component is within a container with { overflow: 'hidden' }.
      Absolute: isTopDown ? [-30, 0, null, 0] : [null, 0, -30, 0],
      height: 30,
      backgroundColor: theme.bg,
    }),
  };

  return (
    <M.div
      className={css(styles.base, props.style).class}
      initial={{ y: isTopDown ? '-100%' : '100%' }}
      animate={{ y: '0%' }}
      exit={{ y: isTopDown ? '-100%' : '100%' }}
      transition={{ duration, type: 'spring', bounce }}
      onClick={props.onClick}
      onDoubleClick={props.onDoubleClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      <div className={styles.mask.class} />
      {props.children}
    </M.div>
  );
};
