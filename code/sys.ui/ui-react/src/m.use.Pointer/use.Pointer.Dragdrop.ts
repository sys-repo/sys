import { useEffect, useRef, useCallback, useState } from 'react';

import { type t, Time } from './common.ts';
import { toModifiers } from './use.Pointer.Drag.ts';
import { DropGuard } from './m.DropGuard.ts';

type AnimationFrameRequest = number;

export const usePointerDragdrop: t.UsePointerDragdrop = (props = {}) => {
  const { onDragdrop, dropGuard = true } = props;
  const active = Boolean(onDragdrop);

  /**
   * Refs:
   */
  const raf = useRef<AnimationFrameRequest>();
  const ref = useRef<HTMLElement | null>(null);

  /**
   * Hooks:
   */
  const [pointer, setPointer] = useState<t.PointerDragdropSnapshot>();
  const [dragging, setDragging] = useState(false);
  const is: t.PointerDragdropHook['is'] = { dragging };

  /**
   * Effect:
   */
  useEffect(() => {
    if (!dropGuard || !ref.current) return;
    DropGuard.enable(ref.current);
    return () => DropGuard.disable(ref.current!);
  }, [dropGuard]);

  /**
   * Methods:
   */
  const start = useCallback(() => {
    if (active) setDragging(true);
  }, [active]);
  const cancel = useCallback(() => {
    setDragging(false);
    setPointer(undefined);
  }, []);

  /**
   * Handler: start tracking target element.
   */
  const onDragEnter: React.DragEventHandler = (e) => {
    if (!onDragdrop) return;
    e.preventDefault();
    if (!is.dragging) start();
  };

  /**
   * Handler: Continuous drag over target.
   */
  const onDragOver: React.DragEventHandler = (e) => {
    if (!onDragdrop) return;
    e.preventDefault();

    const snapshot = toDragdropSnapshot(e);
    const payload: t.PointerDragdropSnapshot = {
      ...snapshot,
      action: 'Drag',
      is: { drag: false, drop: true },
      files: [],
    };

    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      setPointer(payload);
      onDragdrop(payload);
    });
  };

  /**
   * Handler: leave target → stop tracking.
   */
  const onDragLeave: React.DragEventHandler = (e) => {
    if (!onDragdrop) return;
    e.preventDefault();

    // Ignore bubbled leave events from children.
    // Act only when really outside.
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) return;

    cancel();
  };

  /**
   * Handler: dropped → stop tracking & deliver files
   */
  const onDrop: React.DragEventHandler = (e) => {
    if (!onDragdrop) return;
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);
    const snapshot = toDragdropSnapshot(e);
    const payload: t.PointerDragdropSnapshot = {
      ...snapshot,
      action: 'Drop',
      is: { drag: false, drop: true },
      files,
    };
    setPointer(payload);
    onDragdrop(payload);
    Time.delay(cancel); // NB: micro-pause to allow repaint and listeners to the drop to react before clearing.
  };

  /**
   * API:
   */
  return {
    is,
    active,
    handlers: active ? { ref, onDragEnter, onDragOver, onDragLeave, onDrop } : undefined,
    pointer,
    start,
    cancel,
  };
};

/**
 * Helpers:
 */
export function toDragdropSnapshot(e: React.DragEvent): t.PointerSnapshot {
  return {
    movement: { x: e.movementX, y: e.movementY },
    client: { x: e.clientX, y: e.clientY },
    screen: { x: e.screenX, y: e.screenY },
    modifiers: toModifiers(e),
    button: e.button,
  };
}
