import { useEffect, useState } from 'react';
import type { t } from './common.ts';

/**
 * Internal hook that trackes mouse/touch movement events (drag).
 */
export const usePointerDrag: t.UsePointerDrag = (props = {}) => {
  const enabled = Boolean(props.onDrag);
  const [dragging, setDragging] = useState(false);
  const [movement, setMovement] = useState<t.PointerMovement>();

  const handleMove = (e: MouseEvent) => {
    if (!enabled) return;
    const movement = Wrangle.toMouseMovement(e);
    setDragging(true);
    setMovement(movement);
    props.onDrag?.({ ...movement, cancel });
  };

  // NB: Prevent content around the slider from being selected while thumb is dragging.
  const handleSelectStart = (e: Event) => e.preventDefault();

  /**
   * Lifecycle
   */
  useEffect(() => cancel, []); // Ensure disposed.

  /**
   * Methods
   */
  const start = () => {
    const attach = document.addEventListener;
    attach('mousemove', handleMove);
    attach('selectstart', handleSelectStart);
    attach('mouseup', cancel);
  };

  const cancel = () => {
    const detach = document.removeEventListener;
    detach('mousemove', handleMove);
    detach('selectstart', handleSelectStart);
    detach('mouseup', cancel);
    setDragging(false);
    setMovement(undefined);
  };

  /**
   * API
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
 * Helpers
 */
const Wrangle = {
  toMouseMovement(e: MouseEvent): t.PointerMovement {
    const modifiers: t.KeyboardModifierFlags = {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    };
    return {
      movement: { x: e.movementX, y: e.movementY },
      client: { x: e.clientX, y: e.clientY },
      page: { x: e.pageX, y: e.pageY },
      offset: { x: e.offsetX, y: e.offsetY },
      screen: { x: e.screenX, y: e.screenY },
      modifiers,
      button: e.button,
    };
  },
} as const;
