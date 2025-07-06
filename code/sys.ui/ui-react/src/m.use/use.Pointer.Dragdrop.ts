import { useCallback, useState } from 'react';

import type { t } from './common.ts';
import { toModifiers } from './use.Pointer.Drag.ts';

export const usePointerDragdrop: t.UsePointerDragdrop = (props = {}) => {
  const { onDragdrop } = props;
  const enabled = Boolean(onDragdrop);

  /**
   * Hooks:
   */
  const [dragging, setDragging] = useState(false);

  /**
   * Methods:
   */
  const cancel = useCallback(() => setDragging(false), []);
  const start = useCallback(() => {
    if (enabled) setDragging(true);
  }, [enabled]);

  /**
   * API:
   */
  return {
    is: { dragging },
    enabled,
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
