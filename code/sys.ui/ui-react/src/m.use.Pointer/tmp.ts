import { useEffect, useRef, useState } from 'react';
import { type t, useIsTouchSupported } from './common.ts';

const MOVEMENT_THRESHOLD: t.Pixels = 3;

/**
 * Internal hook that tracks low-level mouse/touch movement events (aka. "drag").
 */
export const usePointerDrag: t.UsePointerDrag = (props = {}) => {
  const active = Boolean(props.onDrag);

  /**
   * Refs:
   */
  const startedRef = useRef(false);
  const originRef = useRef<t.Point>(); // position at `start()` of drag operation.
  const prevTouchRef = useRef<t.Point>();
  const draggingRef = useRef(false); // ← CHANGED (1)

  /**
   * Hooks:
   */
  const isTouch = useIsTouchSupported();
  const [, setDraggingState] = useState(false); // ← CHANGED (2)
  const [pointer, setPointer] = useState<t.PointerDragSnapshot>();

  /* `is` now uses a getter so it always reflects `draggingRef.current`. */
  const is = {
    // ← CHANGED (3)
    get dragging(): boolean {
      return draggingRef.current;
    },
  } as t.PointerDragHook['is'];

  /**
   * Effects:
   */
  useEffect(() => cancel, []); // Ensure disposed.

  /**
   * Helpers:
   */
  // NB: Prevent content around the target-element from being selected while dragging.
  const onSelectStart = (e: Event) => e.preventDefault();
  const ensureOrigin = (p: t.Point) => (originRef.current ??= p);
  const movedEnough = (p: t.Point) => {
    const o = originRef.current!;
    return Math.max(Math.abs(p.x - o.x), Math.abs(p.y - o.y)) >= MOVEMENT_THRESHOLD;
  };
  const promoteIfMoved = (p: t.Point) => {
    ensureOrigin(p);
    if (!draggingRef.current && movedEnough(p)) {
      draggingRef.current = true; // ← CHANGED (4)
      setDraggingState(true);
    }
  };

  /**
   * Handlers:
   */
  const onMouseMove = (e: MouseEvent) => {
    if (!active) return;

    const snapshot = toMouseSnapshot(e);
    promoteIfMoved(snapshot.client);
    if (!is.dragging) return; // NB: still below move threshold.

    const payload: t.PointerDragSnapshot = { ...snapshot, cancel };
    e.preventDefault(); // Prevent page-select/scroll during drag.
    setPointer(payload);
    props.onDrag?.(payload);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!active) return;

    const snapshot = toTouchSnapshot(e, prevTouchRef.current);
    promoteIfMoved(snapshot.client);
    if (!is.dragging) return;

    const payload: t.PointerDragSnapshot = { ...snapshot, cancel };
    e.preventDefault(); // Prevent page-select/scroll during drag.
    setPointer(payload);
    props.onDrag?.(payload);
    prevTouchRef.current = snapshot.movement;
  };

  /**
   * Methods:
   */
  const start = () => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Fresh state:
    draggingRef.current = false; // sync
    setDraggingState(false); // async
    setPointer(undefined);
    originRef.current = undefined;
    prevTouchRef.current = undefined;

    const on = document.addEventListener;
    on('selectstart', onSelectStart);
    if (isTouch) {
      on('touchmove', onTouchMove, { passive: false }); // NB: need to be non-passive so we can call `preventDefault` if desired.
      on('touchend', cancel);
    } else {
      on('mousemove', onMouseMove);
      on('mouseup', cancel);
    }
  };

  const cancel = () => {
    if (!startedRef.current) return;
    startedRef.current = false;

    const off = document.removeEventListener;
    off('mouseup', cancel);
    off('mousemove', onMouseMove);
    off('touchmove', onTouchMove);
    off('touchend', cancel);
    off('selectstart', onSelectStart);

    draggingRef.current = false; // sync
    setDraggingState(false); // async
    setPointer(undefined);
    originRef.current = undefined;
    prevTouchRef.current = undefined;
  };

  /**
   * API:
   */
  const api: t.PointerDragHook = {
    is,
    active,
    pointer,
    start,
    cancel,
  };
  return api;
};

/**
 * Helpers:
 */
export function toMouseSnapshot(e: MouseEvent): t.PointerSnapshot {
  return {
    movement: { x: e.movementX, y: e.movementY },
    client: { x: e.clientX, y: e.clientY },
    screen: { x: e.screenX, y: e.screenY },
    modifiers: toModifiers(e),
    button: e.button,
  };
}

export function toTouchSnapshot(e: TouchEvent, touchPrev?: t.Point): t.PointerSnapshot {
  const touch = e.touches[0] ?? e.changedTouches[0];
  const x = touch?.clientX ?? 0;
  const y = touch?.clientY ?? 0;
  const movement = touchPrev ? { x: x - touchPrev.x, y: y - touchPrev.y } : { x: 0, y: 0 };
  return {
    movement,
    client: { x, y },
    screen: { x: touch?.screenX ?? x, y: touch?.screenY ?? y },
    modifiers: toModifiers(e),
    button: 0, // NB: Touch has no concept of mouse buttons.
  };
}

export function toModifiers(e: TouchEvent | MouseEvent | React.DragEvent): t.KeyboardModifierFlags {
  return {
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey,
  };
}
