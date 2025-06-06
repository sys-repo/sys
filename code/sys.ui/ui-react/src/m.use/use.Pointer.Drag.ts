import { useEffect, useRef, useState } from 'react';

import type { t } from './common.ts';
import { useIsTouchSupported } from './use.Is.TouchSupported.ts';

/**
 * Internal hook that trackes mouse/touch movement events (drag).
 */
export const usePointerDrag: t.UsePointerDrag = (props = {}) => {
  const enabled = Boolean(props.onDrag);
  const prevTouchRef = useRef<t.Point>();

  /**
   * Hooks:
   */
  const isTouch = useIsTouchSupported();
  const [dragging, setDragging] = useState(false);
  const [movement, setMovement] = useState<t.PointerMovement>();

  /**
   * Handlers:
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!enabled) return;

    const movement = wrangle.toMouseMovement(e);
    e.preventDefault(); // Prevent page scroll during drag.
    setDragging(true);
    setMovement(movement);
    props.onDrag?.({ ...movement, cancel });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!enabled) return;

    const args = wrangle.toTouchMovement(e, prevTouchRef.current);
    e.preventDefault(); // Prevent page scroll during drag.
    setDragging(true);
    setMovement(args);
    props.onDrag?.({ ...args, cancel });
    prevTouchRef.current = args.movement;
  };

  // NB: Prevent content around the target-element from being selected while dragging.
  const handleSelectStart = (e: Event) => e.preventDefault();

  /**
   * Lifecycle:
   */
  useEffect(() => cancel, []); // Ensure disposed.

  /**
   * Methods:
   */
  const start = () => {
    const on = document.addEventListener;
    on('selectstart', handleSelectStart);
    if (isTouch) {
      on('touchmove', handleTouchMove, { passive: false }); // NB: need to be non-passive so we can call `preventDefault` if desired.
      on('touchend', cancel);
    } else {
      on('mousemove', handleMouseMove);
      on('mouseup', cancel);
    }
  };

  const cancel = () => {
    const off = document.removeEventListener;

    off('mouseup', cancel);
    off('mousemove', handleMouseMove);
    off('touchmove', handleTouchMove);
    off('touchend', cancel);
    off('selectstart', handleSelectStart);

    setDragging(false);
    setMovement(undefined);
    prevTouchRef.current = undefined;
  };

  /**
   * API:
   */
  const api: t.PointerDragHook = {
    is: { dragging },
    enabled,
    movement,
    start,
    cancel,
  };
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  toMouseMovement(e: MouseEvent): t.PointerMovement {
    return {
      movement: { x: e.movementX, y: e.movementY },
      client: { x: e.clientX, y: e.clientY },
      page: { x: e.pageX, y: e.pageY },
      offset: { x: e.offsetX, y: e.offsetY },
      screen: { x: e.screenX, y: e.screenY },
      modifiers: wrangle.modifiers(e),
      button: e.button,
    };
  },

  toTouchMovement(e: TouchEvent, touchPrev?: t.Point): t.PointerMovement {
    const touch = e.touches[0] ?? e.changedTouches[0];
    const x = touch?.clientX ?? 0;
    const y = touch?.clientY ?? 0;
    const movement = touchPrev ? { x: x - touchPrev.x, y: y - touchPrev.y } : { x: 0, y: 0 };
    return {
      movement,
      client: { x, y },
      page: { x: touch?.pageX ?? x, y: touch?.pageY ?? y },
      offset: { x: touch?.clientX ?? x, y: touch?.clientY ?? y },
      screen: { x: touch?.screenX ?? x, y: touch?.screenY ?? y },
      modifiers: wrangle.modifiers(e),
      button: 0, // NB: Touch has no concept of mouse buttons.
    };
  },

  modifiers(e: TouchEvent | MouseEvent): t.KeyboardModifierFlags {
    return {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    };
  },
} as const;
