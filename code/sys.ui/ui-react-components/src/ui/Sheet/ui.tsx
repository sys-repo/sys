import React from 'react';
import { type t, Color, css, DEFAULTS as D, M } from './common.ts';

type P = t.SheetProps;

export const Sheet: React.FC<P> = (props) => {
  const { duration = D.duration, bounce = D.bounce } = props;
  const is = wrangle.is(props);
  const { borderRadius, boxShadow } = wrangle.styles(props);
  const animation = wrangle.animation(props);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const backgroundColor = theme.bg;
  const styles = {
    base: css({
      position: 'relative',
      pointerEvents: 'auto',
      color: theme.fg,
      backgroundColor,
      display: 'grid',
      borderRadius,
      boxShadow,
    }),
    mask: css({
      // NB: Extends the sheet to ensure the physics bounce does not show a flash.
      //     Ensure this component is within a container with { overflow: 'hidden' }.
      ...wrangle.maskOrientation(props),
      backgroundColor,
    }),
  };

  return (
    <M.div
      className={css(styles.base, props.style).class}
      /**
       * Animation:
       */
      initial={animation.initial}
      animate={is.vertical ? { y: '0%' } : { x: '0%' }}
      exit={animation.exit}
      transition={{ duration, type: 'spring', bounce }}
      /**
       * Handlers:
       */
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

/**
 * Helpers
 */
const wrangle = {
  is(props: P) {
    const { orientation = D.orientation.default } = props;
    return {
      vertical: orientation === 'Top:Down' || orientation === 'Bottom:Up',
      topDown: orientation === 'Top:Down',
      leftToRight: orientation === 'Left:Right',
    } as const;
  },

  styles(props: P) {
    const { radius = D.radius } = props;
    const is = wrangle.is(props);
    const shadowColor = Color.format(props.shadowOpacity ?? D.shadowColor);

    let borderRadius: string;
    let boxShadow: string;

    if (is.vertical) {
      if (is.topDown) {
        borderRadius = `0 0 ${radius}px ${radius}px`;
        boxShadow = `0 5px 6px 0 ${shadowColor}`;
      } else {
        borderRadius = `${radius}px ${radius}px 0 0`;
        boxShadow = `0 -5px 6px 0 ${shadowColor}`;
      }
    } else {
      if (is.leftToRight) {
        borderRadius = `0 ${radius}px ${radius}px 0`;
        boxShadow = `5px 0 6px 0 ${shadowColor}`;
      } else {
        borderRadius = `${radius}px 0 0 ${radius}px`;
        boxShadow = `-5px 0 6px 0 ${shadowColor}`;
      }
    }

    return { borderRadius, boxShadow } as const;
  },

  maskOrientation(props: P): t.CssValue {
    const is = wrangle.is(props);
    const buffer = 30;
    if (is.vertical) {
      return {
        Absolute: is.topDown ? [-buffer, 0, null, 0] : [null, 0, -buffer, 0],
        height: buffer,
      };
    } else {
      return {
        Absolute: is.leftToRight ? [0, null, 0, -buffer] : [0, -buffer, 0, null],
        width: buffer,
      };
    }
  },

  animation(props: P) {
    const is = wrangle.is(props);
    const buffer = '10px';
    let initial: Record<string, string>, exit: Record<string, string>;
    if (is.vertical) {
      if (is.topDown) {
        // 'Top:Down'
        initial = { y: `calc(-100% - ${buffer})` };
        exit = { y: `calc(-100% - ${buffer})` };
      } else {
        // 'Bottom:Up'
        initial = { y: `calc(100% + ${buffer})` };
        exit = { y: `calc(100% + ${buffer})` };
      }
    } else {
      if (is.leftToRight) {
        // 'Left:Right'
        initial = { x: `calc(-100% - ${buffer})` };
        exit = { x: `calc(-100% - ${buffer})` };
      } else {
        // 'Right:Left'
        initial = { x: `calc(100% + ${buffer})` };
        exit = { x: `calc(100% + ${buffer})` };
      }
    }
    return { initial, exit } as const;
  },
} as const;
