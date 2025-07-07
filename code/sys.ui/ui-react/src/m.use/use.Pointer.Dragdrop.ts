import { useCallback, useState } from 'react';

import type { t } from './common.ts';
import { toModifiers } from './use.Pointer.Drag.ts';

export const usePointerDragdrop: t.UsePointerDragdrop = (props = {}) => {
  const { onDragdrop } = props;
  const active = Boolean(onDragdrop);

  /**
   * Hooks:
   */
  const [dragging, setDragging] = useState(false);
  const is: t.PointerDragdropHook['is'] = { dragging };

  /**
   * Methods:
   */
  const cancel = useCallback(() => setDragging(false), []);
  const start = useCallback(() => {
    if (active) setDragging(true);
  }, [active]);

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
    const movement = toDragdropSnapshot(e);
    onDragdrop({
      ...movement,
      action: 'Drag',
      files: [],
      cancel: () => e.preventDefault(),
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
    cancel();

    const files = Array.from(e.dataTransfer.files);
    const movement = toDragdropSnapshot(e);
    onDragdrop({
      ...movement,
      action: 'Drop',
      client: { x: e.clientX, y: e.clientY },
      files,
      cancel: () => e.preventDefault(),
    });
  };

  /**
   * API:
   */
  return {
    is,
    active,
    handlers: active ? { onDragEnter, onDragOver, onDragLeave, onDrop } : undefined,
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
