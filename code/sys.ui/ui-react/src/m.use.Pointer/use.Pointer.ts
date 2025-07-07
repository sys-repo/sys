import React, { useCallback, useEffect, useState } from 'react';

import { type t, useIsTouchSupported } from './common.ts';
import { usePointerDrag } from './use.Pointer.Drag.ts';
import { usePointerDragdrop } from './use.Pointer.Dragdrop.ts';

/**
 * Hook: pointer events + optional file drag/drop.
 *
 *   const pointer = usePointer({ onDrag, onDragdrop });
 *   <div {...pointer.handlers} />
 */
export const usePointer: t.UsePointer = (input) => {
  const args = wrangle.args(input);
  const { onDrag, onDragdrop, dropGuard } = args;

  /**
   * Hooks:
   */
  const [isDown, setDown] = useState(false);
  const [isOver, setOver] = useState(false);
  const isTouch = useIsTouchSupported();

  const drag = usePointerDrag({ onDrag });
  const dragdrop = usePointerDragdrop({ onDragdrop, dropGuard });

  const flags = useCallback(
    (patch: Partial<t.PointerHookFlags> = {}) => ({
      over: patch?.over ?? isOver,
      down: patch?.down ?? isDown,
      dragging: drag.is.dragging,
      dragdropping: dragdrop.is.dragging,
    }),
    [isDown, isOver, drag.is.dragging, dragdrop.is.dragging],
  );

  /**
   * Effect: When the low-level drag stops (mouse-up outside) reset "down".
   */
  useEffect(() => {
    if (!drag.is.dragging) {
      setDown(false);
      drag.cancel();
      dragdrop.cancel();
    }
  }, [drag.is.dragging]);

  /**
   * General helpers:
   */
  const firePointer = (
    synthetic: React.PointerEvent,
    trigger: t.PointerEvent,
    patch: Partial<t.PointerHookFlags>,
  ) => {
    args.on?.({
      is: flags(patch),
      synthetic: trigger,
      preventDefault: () => synthetic.preventDefault(),
      stopPropagation: () => synthetic.stopPropagation(),
      cancel() {
        synthetic.preventDefault();
        synthetic.stopPropagation();
      },
    });
  };

  /**
   * Pointer-in / Pointer-out:
   */
  const over = (inside: boolean) => (e: React.PointerEvent) => {
    const trigger = wrangle.pointerEvent(e);
    setOver(inside);
    if (!inside && !drag.is.dragging) setDown(false);
    inside ? args.onEnter?.(trigger) : args.onLeave?.(trigger);
    firePointer(e, trigger, { over: inside, down: isDown });
  };

  /**
   * Pointer-down / Pointer-up:
   */
  const down = (pressed: boolean) => (e: React.PointerEvent) => {
    const trigger = wrangle.pointerEvent(e);
    setDown(pressed);

    if (pressed) {
      args.onDown?.(trigger);
      if (drag.active) drag.start();
    } else {
      args.onUp?.(trigger);
      drag.cancel();
    }

    firePointer(e, trigger, { down: pressed });
  };

  /**
   * Touch helpers (mobile):
   */
  const onTouchStart: React.TouchEventHandler = (ev) => {
    const e = ev as unknown as React.PointerEvent;
    over(true)(e);
    down(true)(e);
  };
  const onTouchEnd: React.TouchEventHandler = (ev) => {
    const e = ev as unknown as React.PointerEvent;
    down(false)(e);
    over(false)(e);
  };

  /**
   * Combine handlers:
   */
  const pointerHandlers = isTouch
    ? { onTouchStart, onTouchEnd, onTouchCancel: onTouchEnd }
    : {
        onMouseDown: down(true),
        onMouseUp: down(false),
        onMouseEnter: over(true),
        onMouseLeave: over(false),
      };

  /**
   * API:
   */
  return {
    handlers: { ...pointerHandlers, ...dragdrop.handlers },
    is: flags(),
    drag: drag.pointer,
    dragdrop: dragdrop.pointer,
    reset() {
      setDown(false);
      setOver(false);
      drag.cancel();
      dragdrop.cancel();
    },
  } as const;
};

/**
 * Helpers:
 */
const wrangle = {
  args(input: unknown): t.PointerHookArgs {
    if (input == null) return {};
    if (typeof input === 'function') return { on: input as t.PointerEventsHandler };
    return input;
  },

  pointerEvent(e: React.PointerEvent): t.PointerEvent {
    return {
      type: e.type,
      synthetic: e,
      client: { x: e.clientX ?? -1, y: e.clientY ?? -1 },
      modifiers: {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
      },
      preventDefault: e.preventDefault.bind(e),
      stopPropagation: e.stopPropagation.bind(e),
      cancel() {
        e.preventDefault();
        e.stopPropagation();
      },
    };
  },
} as const;
