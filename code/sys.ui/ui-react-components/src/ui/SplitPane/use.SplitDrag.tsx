import React from 'react';
import { type t, D, usePointer } from './common.ts';
import { clampPairWithBounds, renormalizePreservingPair } from './u.ts';

type P = t.SplitPaneProps;
type DragRef = {
  startRatios: t.Percent[];
  active?: t.Index; // gutter index (between i and i+1)
  containerSize: number;
  usableSize: number; // containerSize - totalGutter
  startClient: t.Point;
};

export function useSplitDrag(args: {
  paneCount: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  splitRatios: t.SplitPaneRatios;
  collapsed: boolean;
  enabled?: boolean;
  orientation?: t.Orientation;
  gutter?: number;
  onChange?: P['onChange'];
  onDragStart?: P['onDragStart'];
  onDragEnd?: P['onDragEnd'];
}) {
  const {
    enabled = D.enabled,
    orientation = D.orientation,
    gutter = D.gutter,
    paneCount,
    collapsed,
    containerRef,
    splitRatios,
    onChange,
    onDragStart,
    onDragEnd,
  } = args;

  const ratios = splitRatios.ratios;

  const activeGutterRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<DragRef | null>(null);

  const totalGutterPx = collapsed ? 0 : Math.max(0, (paneCount - 1) * gutter);

  const startDrag = (gutterIndex: t.Index, client: t.Point) => {
    if (!enabled || collapsed) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const containerSize = orientation === 'horizontal' ? rect.width : rect.height;
    const usableSize = Math.max(1, containerSize - totalGutterPx);
    dragRef.current = {
      startRatios: ratios.slice(),
      active: gutterIndex,
      containerSize,
      usableSize,
      startClient: client,
    };
    onDragStart?.({ ratios, activeGutter: gutterIndex });
  };

  const applyDrag = (client: t.Point) => {
    const d = dragRef.current;
    if (!d || d.active == null) return;
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const getOffset = () => {
      return orientation === 'horizontal' ? client.x - rect.left : client.y - rect.top;
    };
    const getStart = () => {
      return orientation === 'horizontal'
        ? d.startClient.x - rect.left
        : d.startClient.y - rect.top;
    };

    const pixelDelta = getOffset() - getStart();
    const fracDelta = pixelDelta / d.usableSize;

    const i = d.active;
    const [nextA, nextB] = clampPairWithBounds(
      d.startRatios[i],
      d.startRatios[i + 1],
      fracDelta,
      splitRatios.mins[i],
      splitRatios.maxs[i],
      splitRatios.mins[i + 1],
      splitRatios.maxs[i + 1],
    );

    let next = d.startRatios.slice();
    next[i] = nextA;
    next[i + 1] = nextB;
    next = renormalizePreservingPair(next, i);

    if (!splitRatios.isControlled) splitRatios.set(next);
    onChange?.({ ratios: next, activeGutter: i });
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (d?.active != null) onDragEnd?.({ ratios, activeGutter: d.active });
    dragRef.current = null;
  };

  const pointer = usePointer({
    onDrag: (e) => applyDrag(e.client),
    onDown(e) {
      const i = activeGutterRef.current;
      if (i == null || !enabled || collapsed) return;
      startDrag(i, e.client);
    },
    onUp() {
      activeGutterRef.current = null;
      endDrag();
    },
  });

  /**
   * API:
   */
  return { pointer, activeGutterRef } as const;
}
