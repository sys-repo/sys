import React, { useState } from 'react';

import type { t } from './common.ts';
import { usePointerDrag } from './use.Pointer.Drag.ts';
import { useIsTouchSupported } from './use.Is.TouchSupported.ts';

/**
 * Hook: keep track of mouse/touch events for an HTML element
 * Usage:
 *
 *     const pointer = usePointer();
 *     <div {...pointer.handlers} />
 */
export const usePointer: t.UsePointer = (props = {}) => {
  const { onDrag } = props;

  /**
   * Hooks:
   */
  const [isDown, setDown] = useState(false);
  const [isOver, setOver] = useState(false);
  const drag = usePointerDrag({ onDrag });
  const isTouch = useIsTouchSupported();

  const down = (isDown: boolean) => (ev: React.PointerEvent) => {
    const e = wrangle.pointerEvent(ev);
    setDown(isDown);
    if (isDown) props.onDown?.(e);
    if (!isDown) props.onUp?.(e);
    if (!isDown) drag.cancel();
    if (isDown && drag.enabled) drag.start();
  };
  const over = (isOver: boolean) => (ev: React.PointerEvent) => {
    const e = wrangle.pointerEvent(ev);
    setOver(isOver);
    if (isOver === false) setDown(false);
    if (isOver) props.onEnter?.(e);
    if (!isOver) props.onLeave?.(e);
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
    is: {
      over: isOver,
      down: isDown,
      dragging: drag.is.dragging,
    },
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
  pointerEvent(e: React.PointerEvent): t.PointerEvent {
    return {
      type: e.type,
      synthetic: e,
      client: wrangle.point(e),
      modifiers: { alt: e.altKey, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey },
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      cancel() {
        e.preventDefault();
        e.stopPropagation();
      },
    };
  },

  point(ev: React.PointerEvent) {
    type T = React.TouchEvent;

    if (ev.type === 'touchstart') {
      const touch = (ev as unknown as T).touches[0];
      return { x: touch.clientX, y: touch.clientY };
    }

    if (ev.type === 'touchend') {
      const touch = (ev as unknown as T).changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }

    return { x: ev.clientX ?? -1, y: ev.clientY ?? -1 };
  },
} as const;
