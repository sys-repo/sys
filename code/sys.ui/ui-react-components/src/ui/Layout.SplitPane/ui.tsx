import React from 'react';
import { type t, Color, css, D } from './common.ts';

import { templateTracks } from './u.tmpl.ts';
import { clampPairWithBounds, renormalizePreservingPair } from './u.ts';
import { Gutter } from './ui.Gutter.tsx';
import { Pane } from './ui.Pane.tsx';
import { useSplitDrag } from './use.SplitDrag.tsx';
import { useSplitRatios } from './use.SplitRatios.tsx';

export const SplitPane: React.FC<t.SplitPaneProps> = (props) => {
  const {
    debug = false,
    children = [],
    active = D.active,
    orientation = D.orientation,
    defaultValue,
    value,
    min = 0,
    max = 1,
    gutter = D.gutter,
    dividerOpacity = D.dividerOpacity,
    dividerLine = D.dividerLine,
    onlyIndex,
    onChange,
    onDragStart,
    onDragEnd,
  } = props;

  const n = Math.max(0, children.length);
  const collapsed = onlyIndex != null && onlyIndex >= 0 && onlyIndex < n;

  /**
   * Ratios: controlled/uncontrolled:
   */
  const splitRatios = useSplitRatios({ n, value, defaultValue, min, max });
  const ratios = splitRatios.ratios;

  /**
   * Drag interaction
   */
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { pointer, activeGutterRef } = useSplitDrag({
    paneCount: n,
    active,
    orientation,
    gutter,
    collapsed,
    containerRef,
    splitRatios,
    onChange,
    onDragStart,
    onDragEnd,
  });

  /**
   * Grid template:
   */
  const template = templateTracks({
    ratios,
    gutter: dividerLine,
    orientation,
    collapsed,
    onlyIndex,
    paneCount: n,
  });

  /**
   * Keyboard step (small ratio delta) for a given gutter:
   */
  const stepPair = (gutterIndex: number, delta: number) => {
    const i = gutterIndex;
    const [nextA, nextB] = clampPairWithBounds(
      ratios[i],
      ratios[i + 1],
      delta,
      splitRatios.mins[i],
      splitRatios.maxs[i],
      splitRatios.mins[i + 1],
      splitRatios.maxs[i + 1],
    );
    let next = ratios.slice();
    next[i] = nextA;
    next[i + 1] = nextB;
    next = renormalizePreservingPair(next, i);
    if (!splitRatios.isControlled) splitRatios.set(next);
    onChange?.({ ratios: next, activeGutter: i });
  };

  /**
   * Styles:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      width: '100%',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
      userSelect: active ? 'none' : 'auto',
      touchAction: orientation === 'horizontal' ? 'pan-y' : 'pan-x',
      display: 'grid',
      gridTemplateColumns: template.cols,
      gridTemplateRows: template.rows,
      isolation: 'isolate',
    }),
  };

  /**
   * Render panes + gutters:
   */
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const hidden = collapsed && i !== onlyIndex;

    nodes.push(
      <Pane
        key={`pane-${i}`}
        index={i}
        hidden={hidden}
        debug={debug}
        theme={props.theme}
        children={children[i]}
      />,
    );

    if (i < n - 1) {
      nodes.push(
        <Gutter
          key={`gutter-${i}`}
          index={i}
          debug={debug}
          theme={props.theme}
          active={active}
          collapsed={collapsed}
          orientation={orientation}
          ratios={ratios}
          gutter={gutter}
          dividerLine={dividerLine}
          dividerOpacity={dividerOpacity}
          pointerHandlers={pointer.handlers}
          onStep={(idx, delta) => stepPair(idx, delta)}
          setActive={(idx) => (activeGutterRef.current = idx)} // Mark which gutter should start dragging on pointer down.
        />,
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className={css(styles.base, props.style).class}
      data-part={'splitpane'}
      data-orientation={orientation}
      data-count={n}
      data-only={collapsed ? onlyIndex : 'none'}
    >
      {nodes}
    </div>
  );
};
