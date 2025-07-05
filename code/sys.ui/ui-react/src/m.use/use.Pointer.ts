import React, { useState } from 'react';

import { type t, Is } from './common.ts';
import { useIsTouchSupported } from './use.Is.TouchSupported.ts';
import { usePointerDrag } from './use.Pointer.Drag.ts';

/**
 * Hook: keep track of mouse/touch events for an HTML element
 * Usage:
 *
 *     const pointer = usePointer();
 *     <div {...pointer.handlers} />
 */
export const usePointer: t.UsePointer = (input) => {
  const args = wrangle.args(input);
  const { onDrag } = args;

  /**
   * Hooks:
   */
  const [isDown, setDown] = useState(false);
  const [isOver, setOver] = useState(false);
  const isTouch = useIsTouchSupported();
  const drag = usePointerDrag({ onDrag });

  /**
   * Handlers:
   */
  const getFlags = (known?: {
    isOver?: boolean;
    isDown?: boolean;
    isDragging?: boolean;
  }): t.PointerHookFlags => {
    return {
      over: known?.isOver ?? isOver,
      down: known?.isDown ?? isDown,
      dragging: known?.isDragging ?? drag.is.dragging,
    };
  };

  const fireGeneral = (
    synthetic: React.PointerEvent,
    trigger: t.PointerEvent,
    known: { isOver?: boolean; isDown?: boolean },
  ) => {
    const cancel = () => {
      synthetic.stopPropagation();
      synthetic.preventDefault();
    };
    args.on?.({ is: getFlags(known), synthetic: trigger, cancel });
  };

  const down = (isDown: boolean) => (synthetic: React.PointerEvent) => {
    const e = wrangle.pointerEvent(synthetic);
    setDown(isDown);
    if (isDown) args.onDown?.(e);
    if (!isDown) args.onUp?.(e);
    if (!isDown) drag.cancel();
    if (isDown && drag.enabled) drag.start();
    fireGeneral(synthetic, e, { isDown });
  };
  const over = (isOver: boolean) => (synthetic: React.PointerEvent) => {
    const e = wrangle.pointerEvent(synthetic);
    setOver(isOver);
    if (isOver === false) setDown(false);
    if (isOver) args.onEnter?.(e);
    if (!isOver) args.onLeave?.(e);
    fireGeneral(synthetic, e, { isOver });
  };

  /**
   * Mouse handlers:
   */
  const onMouseDown = down(true);
  const onMouseUp = down(false);
  const onMouseEnter = over(true);
  const onMouseLeave = over(false);

  /**
   * Touch handlers:
   */
  const onTouchStart: React.TouchEventHandler = (ev) => {
    // Treat touch-start like "mouse-down + enter".
    const e = ev as unknown as React.PointerEvent;
    onMouseEnter(e);
    onMouseDown(e);
  };

  const onTouchEnd: React.TouchEventHandler = (ev) => {
    // Finger lifted: no longer "over" the element.
    const e = ev as unknown as React.PointerEvent;
    onMouseLeave(e);
    onMouseUp(e);
  };

  const onTouchCancel: React.TouchEventHandler = (ev) => {
    // Cancelled touches behave like "up + leave".
    const e = ev as unknown as React.PointerEvent;
    onMouseLeave(e);
    onMouseUp(e);
  };

  /**
   * API:
   */
  const api: t.PointerHook = {
    handlers: isTouch
      ? { onTouchStart, onTouchEnd, onTouchCancel }
      : { onMouseDown, onMouseUp, onMouseEnter, onMouseLeave },
    is: getFlags(),
    drag: drag.movement,
    reset() {
      setDown(false);
      setOver(false);
      drag.cancel();
    },
  };
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  args(input: unknown): t.PointerHookArgs {
    if (input == null) return {};
    if (Is.func(input)) return { on: input as t.PointerEventsHandler };
    return input;
  },

  pointerEvent(e: React.PointerEvent): t.PointerEvent {
    return {
      type: e.type,
      synthetic: e,
      client: wrangle.point(e),
      modifiers: wrangle.modifiers(e),
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      cancel() {
        e.preventDefault();
        e.stopPropagation();
      },
    };
  },

  point(e: React.PointerEvent) {
    type T = React.TouchEvent;

    if (e.type === 'touchstart') {
      const touch = (e as unknown as T).touches[0];
      return { x: touch.clientX, y: touch.clientY };
    }

    if (e.type === 'touchend') {
      const touch = (e as unknown as T).changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }

    return { x: e.clientX ?? -1, y: e.clientY ?? -1 };
  },

  modifiers(e: React.PointerEvent): t.KeyboardModifierFlags {
    return {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    };
  },
} as const;
