import React from 'react';
import { type t, Color, css } from './common.ts';
import { Debug } from './ui.Debug.tsx';

export type GutterProps = {
  index: number; // NB: between pane i and i+1
  active?: boolean;
  collapsed?: boolean;
  orientation?: t.Orientation;
  ratios: t.Percent[];
  gutterLine?: t.Pixels;
  gutterOpacity?: t.Percent;
  pointerHandlers: Record<string, unknown>; // Pointer handlers from usePointer.

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Mark this gutter as active before pointer starts
  setActive: (i: number) => void;

  // Keyboard nudge: Arrow keys step the pair
  onStep?: (gutterIndex: number, delta: number) => void;
};

export const Gutter: React.FC<GutterProps> = (props) => {
  const {
    index,
    active = true,
    collapsed = false,
    orientation = 'horizontal',
    ratios,
    gutterLine = 2,
    gutterOpacity = 0.2,
    debug = false,
    pointerHandlers,
    setActive,
    onStep,
  } = props;

  const i = index;
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
      alignItems: 'stretch',
      justifyItems: 'stretch',
      outline: 'none',
      cursor:
        active && !collapsed
          ? orientation === 'horizontal'
            ? 'col-resize'
            : 'row-resize'
          : 'default',
      pointerEvents: collapsed ? 'none' : 'auto',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
    line: css({
      backgroundColor: Color.alpha(theme.fg, gutterOpacity),
      ...(orientation === 'horizontal'
        ? { width: gutterLine === 0 ? 0 : gutterLine, justifySelf: 'center' }
        : { height: gutterLine === 0 ? 0 : gutterLine, alignSelf: 'center' }),
    }),
    handle: css({ position: 'absolute', inset: 0 }),
    debugLabel: css({
      position: 'absolute',
      top: 4,
      right: 6,
      left: '100%',
      marginLeft: 6,
    }),
  };

  const ariaNow = Math.round((ratios[i] / (ratios[i] + ratios[i + 1])) * 100);
  const elDebug = debug && (
    <Debug
      //
      theme={theme.name}
      index={i}
      ratios={ratios}
      style={{ Absolute: [4, 6, null, null] }}
    />
  );

  return (
    <div
      className={css(styles.base, props.style).class}
      tabIndex={collapsed ? -1 : 0}
      role={'separator'}
      aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-hidden={collapsed ? true : undefined}
      {...(!collapsed && { 'aria-valuenow': ariaNow })}
      data-part={'gutter'}
      data-gutter-index={i}
      onKeyDown={(e) => {
        if (!active || collapsed) return;
        if (!onStep) return;
        const step = 0.02 as t.Percent;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onStep(i, -step);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onStep(i, +step);
      }}
    >
      <div className={styles.line.class} />
      <div
        {...pointerHandlers}
        className={styles.handle.class}
        onPointerDownCapture={() => setActive(i)}
      />
      {elDebug}
    </div>
  );
};
