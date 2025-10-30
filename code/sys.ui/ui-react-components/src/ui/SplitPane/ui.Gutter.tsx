import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Debug } from './ui.Debug.tsx';

export type GutterProps = {
  index: number; // NB: between pane i and i+1
  active?: boolean;
  collapsed?: boolean;
  orientation?: t.Orientation;
  ratios: t.Percent[];
  dividerLine?: t.Pixels;
  dividerOpacity?: t.Percent;
  gutter?: t.Pixels;
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
    dividerLine = 2,
    dividerOpacity = 0.2,
    debug = false,
    gutter = D.gutter,
    pointerHandlers,
    setActive,
    onStep,
  } = props;
  const i = index;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const isHorizontal = orientation === 'horizontal';
  const cursor = active && !collapsed ? (isHorizontal ? 'col-resize' : 'row-resize') : 'default';
  const styles = {
    base: css({ position: 'relative' }),
    body: css({
      Absolute: [0, 0 - gutter / 2, 0, 0 - gutter / 2],
      pointerEvents: collapsed ? 'none' : 'auto',
      color: theme.fg,
      cursor,
      outline: 'none',
      zIndex: 2,
      display: 'grid',
      alignItems: 'stretch',
      justifyItems: 'stretch',
    }),
    line: css({
      backgroundColor: Color.alpha(theme.fg, dividerOpacity),
      ...(orientation === 'horizontal'
        ? { width: dividerLine === 0 ? 0 : dividerLine, justifySelf: 'center' }
        : { height: dividerLine === 0 ? 0 : dividerLine, alignSelf: 'center' }),
    }),
    handle: css({ position: 'absolute', inset: 0 }),
    debugLabel: css({ position: 'absolute', top: 4, right: 6, left: '100%', marginLeft: 6 }),
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
      <div className={styles.body.class}>
        <div className={styles.line.class} />
        <div
          {...pointerHandlers}
          className={styles.handle.class}
          onPointerDownCapture={() => setActive(i)}
        />
        {elDebug}
      </div>
    </div>
  );
};
