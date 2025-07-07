import { useEffect, useRef, useState } from 'react';
import type { t } from './common.ts';
import { useIsTouchSupported } from './use.Is.TouchSupported.ts';

/**
 * Internal hook that trackes mouse/touch movement events (drag).
 */
export const usePointerDrag: t.UsePointerDrag = (props = {}) => {
  const active = Boolean(props.onDrag);

  /**
   * Refs:
   */
  const prevTouchRef = useRef<t.Point>();
  const startedRef = useRef(false);

  /**
   * Hooks:
   */
  const isTouch = useIsTouchSupported();
  const [pointer, setPointer] = useState<t.PointerDragSnapshot>();
  const [dragging, setDragging] = useState(false);
  const is: t.PointerDragHook['is'] = { dragging };

  /**
   * Handlers:
   */
  const onMouseMove = (e: MouseEvent) => {
    if (!active) return;

    const snapshot = toMouseSnapshot(e);
    const payload: t.PointerDragSnapshot = { ...snapshot, cancel };
    e.preventDefault(); // Prevent page scroll during drag.
    setDragging(true);
    setPointer(payload);
    props.onDrag?.(payload);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!active) return;

    const snapshot = toTouchSnapshot(e, prevTouchRef.current);
    const payload: t.PointerDragSnapshot = { ...snapshot, cancel };
    e.preventDefault(); // Prevent page scroll during drag.

    setDragging(true);
    setPointer(payload);
    props.onDrag?.(payload);
    prevTouchRef.current = snapshot.movement;
  };

  // NB: Prevent content around the target-element from being selected while dragging.
  const onSelectStart = (e: Event) => e.preventDefault();

  /**
   * Lifecycle:
   */
  useEffect(() => cancel, []); // Ensure disposed.

  /**
   * Methods:
   */
  const start = () => {
    if (startedRef.current) return;
    startedRef.current = true;

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

    setDragging(false);
    setPointer(undefined);
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
