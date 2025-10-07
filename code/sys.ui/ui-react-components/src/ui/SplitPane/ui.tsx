import React, { useState } from 'react';
import { type t, Color, css, D, usePointer } from './common.ts';
import { clamp } from './u.ts';

export const SplitPane: React.FC<t.SplitPaneProps> = (props) => {
  const {
    debug = false,
    children,
    value,
    enabled = D.enabled,
    orientation = D.orientation,
    defaultValue = D.defaultValue,
    min = D.min,
    max = D.max,
    gutter = D.gutter,
    gutterOpacity = D.gutterOpacity,
    gutterLine = D.gutterLine,
    only,
    onChange,
    onDragStart,
    onDragEnd,
  } = props;
  const isControlled = typeof value === 'number';
  const isOnlyA = only === 'A';
  const isOnlyB = only === 'B';
  const collapsed = isOnlyA || isOnlyB;

  /**
   * Refs:
   */
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  /**
   * State:
   */
  const [ratioUncontrolled, setRatioUncontrolled] = useState<number>(clamp(defaultValue, min, max));
  const ratio = clamp(isControlled ? (value as number) : ratioUncontrolled, min, max);
  const pointer = usePointer({
    onDown: () => {
      if (!enabled) return;
      onDragStart?.({ ratio });
    },
    onUp: () => {
      if (!enabled) return;
      onDragEnd?.({ ratio });
    },
    onDrag: (e) => {
      if (!enabled) return;
      const next = toRatioFromClientPoint(e.client);
      update(next);
    },
  });

  /**
   * Handlers:
   */
  const update = React.useCallback(
    (next: number) => {
      const ratio = clamp(next, min, max);
      if (!isControlled) setRatioUncontrolled(ratio);
      onChange?.({ ratio });
    },
    [isControlled, min, max, onChange],
  );

  const toRatioFromClientPoint = React.useCallback(
    (client: t.Point) => {
      const el = containerRef.current;
      if (!el) return ratio;

      const rect = el.getBoundingClientRect();
      const collapsed = only === 'A' || only === 'B';
      const g = collapsed ? 0 : gutter;

      const size = () => (orientation === 'horizontal' ? rect.width : rect.height);
      const offset = () =>
        orientation === 'horizontal' ? client.x - rect.left : client.y - rect.top;

      // In 'only' mode the gutter is inert; preserve current ratio.
      if (collapsed) return ratio;

      const usable = Math.max(1, size() - g);
      const next = (offset() - g / 2) / usable;
      return clamp(next, min, max);
    },
    [containerRef, orientation, gutter, min, max, ratio, only],
  );

  const template = React.useMemo(() => {
    const g = isOnlyA || isOnlyB ? 0 : gutter;

    const withAxis = (a: string, c: string) =>
      orientation === 'horizontal'
        ? { cols: `${a} ${g}px ${c}`, rows: '1fr' }
        : { cols: '1fr', rows: `${a} ${g}px ${c}` };

    if (isOnlyA) return withAxis('1fr', '0fr');
    if (isOnlyB) return withAxis('0fr', '1fr');
    return withAxis(`${ratio}fr`, `${1 - ratio}fr`);
  }, [orientation, ratio, gutter, isOnlyA, isOnlyB]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const gutterSize = collapsed ? 0 : gutter;
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      width: '100%',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
      userSelect: enabled ? 'none' : 'auto',
      touchAction: orientation === 'horizontal' ? 'pan-y' : 'pan-x',
      display: 'grid',
      gridTemplateColumns: template.cols,
      gridTemplateRows: template.rows,
    }),
    pane: css({
      minWidth: 0,
      minHeight: 0,
      overflow: 'auto',
      display: 'grid',
    }),
    gutter: css({
      position: 'relative',
      cursor:
        enabled && !collapsed
          ? orientation === 'horizontal'
            ? 'col-resize'
            : 'row-resize'
          : 'default',
      display: 'grid',
      alignItems: 'stretch',
      justifyItems: 'stretch',
      outline: 'none',
      pointerEvents: collapsed ? 'none' : 'auto', // Keep it in DOM, but inert when collapsed.
    }),
    line: css({
      backgroundColor: Color.alpha(theme.fg, gutterOpacity),
      ...(orientation === 'horizontal'
        ? { width: gutterSize === 0 ? 0 : gutterLine, justifySelf: 'center' }
        : { height: gutterSize === 0 ? 0 : gutterLine, alignSelf: 'center' }),
    }),
    handle: css({
      position: 'absolute',
      inset: 0,
    }),
    debugLabel: css({
      position: 'absolute',
      top: 4,
      right: 6,
      fontSize: 11,
      opacity: 0.6,
      pointerEvents: 'none',
      userSelect: 'none',
    }),
    hiddenPane: css({
      visibility: 'hidden',
      pointerEvents: 'none',
      overflow: 'hidden',
    }),
  };

  const elPaneA = (
    <div
      className={css(styles.pane, isOnlyB && styles.hiddenPane).class}
      data-part={'pane-a'}
      data-hidden={isOnlyB || undefined}
    >
      {children?.[0]}
    </div>
  );

  const elPaneB = (
    <div
      className={css(styles.pane, isOnlyA && styles.hiddenPane).class}
      data-part={'pane-b'}
      data-hidden={isOnlyA || undefined}
    >
      {children?.[1]}
    </div>
  );

  const elGutter = (
    <div
      className={styles.gutter.class}
      tabIndex={collapsed ? -1 : 0}
      data-part={'gutter'}
      role={'separator'}
      aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-hidden={collapsed ? true : undefined}
      {...(!collapsed && {
        'aria-valuenow': Math.round(ratio * 100),
        'aria-valuemin': Math.round(min * 100),
        'aria-valuemax': Math.round(max * 100),
      })}
      onKeyDown={(e) => {
        if (!enabled || collapsed) return;
        const step = 0.02 as t.Percent;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') update(ratio - step);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') update(ratio + step);
      }}
    >
      <div className={styles.line.class} />
      <div {...pointer.handlers} className={styles.handle.class} />
      {debug && <div className={styles.debugLabel.class}>{`${Math.round(ratio * 100)}%`}</div>}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={css(styles.base, props.style).class}
      data-part={'splitpane'}
      data-orientation={orientation}
      data-only={only ?? 'none'}
    >
      {elPaneA}
      {elGutter}
      {elPaneB}
    </div>
  );
};
