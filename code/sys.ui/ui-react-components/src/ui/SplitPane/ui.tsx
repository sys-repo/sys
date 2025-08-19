import React, { useState } from 'react';
import { type t, Color, css, D, usePointer } from './common.ts';

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
    onChange,
    onDragStart,
    onDragEnd,
  } = props;
  const isControlled = typeof value === 'number';

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
      onDragStart?.(ratio);
    },
    onUp: () => {
      if (!enabled) return;
      onDragEnd?.(ratio);
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
      const clamped = clamp(next, min, max);
      if (!isControlled) setRatioUncontrolled(clamped);
      onChange?.(clamped);
    },
    [isControlled, min, max, props],
  );

  const toRatioFromClientPoint = React.useCallback(
    (client: t.Point) => {
      const el = containerRef.current;
      if (!el) return ratio;
      const rect = el.getBoundingClientRect();

      if (orientation === 'horizontal') {
        const px = client.x - rect.left;
        const usable = Math.max(1, rect.width - gutter);
        const next = (px - gutter / 2) / usable;
        return clamp(next, min, max);
      } else {
        const py = client.y - rect.top;
        const usable = Math.max(1, rect.height - gutter);
        const next = (py - gutter / 2) / usable;
        return clamp(next, min, max);
      }
    },
    [containerRef, orientation, gutter, min, max, ratio],
  );

  const template = React.useMemo(() => {
    return orientation === 'horizontal'
      ? { cols: `${ratio}fr ${gutter}px ${1 - ratio}fr`, rows: '1fr' }
      : { cols: '1fr', rows: `${ratio}fr ${gutter}px ${1 - ratio}fr` };
  }, [orientation, ratio, gutter]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,

      display: 'grid',
      gridTemplateColumns: template.cols,
      gridTemplateRows: template.rows,
      width: '100%',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
      userSelect: enabled ? 'none' : 'auto',
      touchAction: orientation === 'horizontal' ? 'pan-y' : 'pan-x',
    }),
    pane: css({
      minWidth: 0,
      minHeight: 0,
      overflow: 'auto',
    }),
    gutter: css({
      position: 'relative',
      cursor: enabled ? (orientation === 'horizontal' ? 'col-resize' : 'row-resize') : 'default',
      display: 'grid',
      alignItems: 'stretch',
      justifyItems: 'stretch',
    }),
    line: css({
      backgroundColor: 'var(--divider, rgba(128,128,128,0.35))',
      ...(orientation === 'horizontal'
        ? { width: '1px', justifySelf: 'center' }
        : { height: '1px', alignSelf: 'center' }),
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
  };

  return (
    <div
      ref={containerRef}
      className={css(styles.base, props.style).class}
      data-part={'splitpane'}
      data-orientation={orientation}
    >
      <div className={styles.pane.class} data-part={'pane-a'}>
        {children?.[0]}
      </div>

      <div
        className={styles.gutter.class}
        data-part={'gutter'}
        role={'separator'}
        aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(min * 100)}
        aria-valuemax={Math.round(max * 100)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!enabled) return;
          const step = 0.02 as t.Percent;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') update(ratio - step);
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') update(ratio + step);
        }}
      >
        <div className={styles.line.class} />
        <div {...pointer.handlers} className={styles.handle.class} />
        {debug && <div className={styles.debugLabel.class}>{`${Math.round(ratio * 100)}%`}</div>}
      </div>

      <div className={styles.pane.class} data-part={'pane-b'}>
        {children?.[1]}
      </div>
    </div>
  );
};

/**
 * Helpers:
 */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
