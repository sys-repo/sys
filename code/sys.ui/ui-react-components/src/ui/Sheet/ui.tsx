import React from 'react';
import { type t, Color, css, DEFAULTS as D, M } from './common.ts';

type P = t.SheetProps;

export const Sheet: React.FC<P> = (props) => {
  const { duration = D.duration, bounce = D.bounce, pointerEvents = 'auto' } = props;
  const is = wrangle.is(props);
  const animation = wrangle.animation(props);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const backgroundColor = theme.bg;
  const { borderRadius, boxShadow, gridTemplateColumns, gridTemplateRows } = wrangle.styles(props);
  const styles = {
    base: css({ position: 'relative', display: 'grid', gridTemplateColumns, gridTemplateRows }),
    spacer: css({ pointerEvents: 'none' }),
    body: css({
      position: 'relative',
      pointerEvents,
      color: theme.fg,
      backgroundColor,
      borderRadius,
      boxShadow,
      display: 'grid',
    }),
    mask: css({
      // NB: Extends the sheet to ensure the physics bounce does not show a flash.
      //     Ensure this component is within a container with { overflow: 'hidden' }.
      ...wrangle.maskOrientation(props),
      backgroundColor,
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <div className={styles.mask.class} />
      {props.children}
    </div>
  );

  return (
    <M.div
      data-component={`sys.ui.Sheet`}
      className={css(styles.base, props.style).class}
      /**
       * Animation:
       */
      initial={animation.initial}
      animate={is.vertical ? { y: '0%' } : { x: '0%' }}
      exit={animation.exit}
      transition={{ type: 'spring', bounce, duration }}
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
      <div className={styles.spacer.class} />
      {elBody}
      <div className={styles.spacer.class} />
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
    const shadowColor = Color.format(props.shadowOpacity ?? D.shadow.color);
    const blurRadius = props.shadowBlurRadius ?? D.shadow.blurRadius;
    const spreadRadius = props.shadowSpreadRadius ?? D.shadow.spreadRadius;
    const edgeMargin = wrangle.edgeMarginTemplate(props);

    let borderRadius: string;
    let boxShadow: string;
    let gridTemplateColumns: string | undefined;
    let gridTemplateRows: string | undefined;

    const toBoxShadow = (x: number, y: number) => {
      return `${x}px ${y}px ${blurRadius}px ${spreadRadius} ${shadowColor}`;
    };

    if (is.vertical) {
      gridTemplateColumns = edgeMargin;
      if (is.topDown) {
        borderRadius = `0 0 ${radius}px ${radius}px`;
        boxShadow = toBoxShadow(0, 5);
      } else {
        borderRadius = `${radius}px ${radius}px 0 0`;
        boxShadow = toBoxShadow(0, -5);
      }
    } else {
      gridTemplateRows = edgeMargin;
      if (is.leftToRight) {
        borderRadius = `0 ${radius}px ${radius}px 0`;
        boxShadow = toBoxShadow(5, 0);
      } else {
        borderRadius = `${radius}px 0 0 ${radius}px`;
        boxShadow = toBoxShadow(-5, 0);
      }
    }

    return { borderRadius, boxShadow, gridTemplateColumns, gridTemplateRows } as const;
  },

  edgeMargin(props: P): [t.SheetMargin, t.SheetMargin, t.SheetMargin] {
    const v = props.edgeMargin;
    if (typeof v === 'number') return [v, '1fr', v];
    if (Array.isArray(v)) {
      if (v.length === 2) return [v[0], '1fr', v[1]];
      if (v.length === 3) return v;
    }
    return [0, '1fr', 0];
  },

  edgeMarginTemplate(props: P): string {
    const margin = wrangle.edgeMargin(props);
    return margin.map((v) => (typeof v === 'number' ? `${v}px` : v)).join(' ');
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
