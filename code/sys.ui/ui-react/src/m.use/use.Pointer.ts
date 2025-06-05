import { useState } from 'react';

import type { t } from './common.ts';
import { useMouseDrag } from './use.Pointer.Drag.ts';

/**
 * Hook: keep track of mouse events for an HTML element
 * Usage:
 *
 *     const pointer = usePointer();
 *     <div {...pointer.handlers} />
 */
export const useMouse: t.UseMouse = (props = {}) => {
  const { onDrag } = props;
  const [isDown, setDown] = useState(false);
  const [isOver, setOver] = useState(false);
  const drag = useMouseDrag({ onDrag });

  const down = (isDown: boolean) => (e: React.PointerEvent) => {
    setDown(isDown);
    if (isDown) props.onDown?.(e);
    if (!isDown) props.onUp?.(e);
    if (!isDown) drag.cancel();
    if (isDown && drag.enabled) drag.start();
  };
  const over = (isOver: boolean) => (e: React.PointerEvent) => {
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
   * Touch handlers (mobile/track-pad):
   */
  const onTouchStart: React.TouchEventHandler = (ev) => {
    // Treat touch-start like mouse-down + enter.
    const e = ev as unknown as React.PointerEvent;
    setOver(true);
    over(true)(e);
    down(true)(e);
  };

  const onTouchEnd: React.TouchEventHandler = (ev) => {
    // Finger lifted: no longer “over” the element.
    const e = ev as unknown as React.PointerEvent;
    down(false)(e);
    over(false)(e);
  };

  const onTouchCancel: React.TouchEventHandler = (ev) => {
    // Cancelled touches behave like “up + leave”.
    const e = ev as unknown as React.PointerEvent;
    down(false)(e);
    over(false)(e);
  };

  /**
   * API
   */
  const api: t.MouseHook = {
    is: {
      over: isOver,
      down: isDown,
      dragging: drag.is.dragging,
    },
    handlers: {
      // Mouse:
      onMouseDown,
      onMouseUp,
      onMouseEnter,
      onMouseLeave,
      // Touch:
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
