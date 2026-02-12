import React, { useCallback, useEffect, useRef, useState } from 'react';

import { type t, Kbd, useIsTouchSupported } from './common.ts';
import { usePointerDrag } from './use.Pointer.Drag.ts';
import { usePointerDragdrop } from './use.Pointer.Dragdrop.ts';

/**
 * Hook: pointer events + optional file drag/drop.
 * @example:
 *
 *   const pointer = usePointer({ onDrag, onDragdrop });
 *   <div {...pointer.handlers} />
 *
 */
export const usePointer: t.UsePointer = (input) => {
  const args = wrangle.args(input);
  const { onDrag, onDragdrop, dropGuard } = args;

  /**
   * Hooks:
   */
  const [isDown, setDown] = useState(false);
  const downRef = useRef(false);
  const [isOver, setOver] = useState(false);
  const [isFocused, setFocused] = React.useState(false);
  const isTouch = useIsTouchSupported();

  const drag = usePointerDrag({ onDrag });
  const dragdrop = usePointerDragdrop({ onDragdrop, dropGuard });

  const flags = useCallback(
    (patch: Partial<t.PointerHookFlags> = {}) => {
      const down = patch?.down ?? isDown;
      return {
        over: patch?.over ?? isOver,
        down,
        up: !down,
        dragging: drag.is.dragging,
        dragdropping: dragdrop.is.dragging,
        focused: isFocused,
      };
    },
    [isDown, isOver, drag.is.dragging, dragdrop.is.dragging, isFocused],
  );

  /**
   * Effect:
   *    When the low-level drag stops
   *    (ie. mouse-up outside) reset "down".
   *
   */
  useEffect(() => {
    if (!drag.is.dragging) {
      downRef.current = false;
      setDown(false);
      drag.cancel();
      dragdrop.cancel();
    }
  }, [drag.is.dragging]);

  /**
   * General helpers:
   */
  const fire = (
    synthetic: t.PointerSyntheticEvent,
    trigger: t.PointerEvent,
    patch: Partial<t.PointerHookFlags>,
  ) => {
    args.on?.({
      is: flags(patch),
      synthetic: trigger,
      modifiers: Kbd.modifiers(synthetic),
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
  const over = (inside: boolean) => (e: t.PointerSyntheticEvent) => {
    const trigger = wrangle.pointerEvent(e);
    setOver(inside);
    inside ? args.onEnter?.(trigger) : args.onLeave?.(trigger);
    fire(e, trigger, { over: inside, down: isDown });
  };

  /**
   * Pointer helpers:
   */
  const releasePointerCapture = (e: React.PointerEvent) => {
    const { currentTarget, pointerId } = e;
    if (currentTarget.hasPointerCapture(pointerId)) {
      currentTarget.releasePointerCapture(pointerId);
    }
  };

  const down = (e: t.PointerSyntheticEvent) => {
    downRef.current = true;
    const trigger = wrangle.pointerEvent(e);
    setDown(true);
    args.onDown?.(trigger);
    if (drag.active) drag.start();
    fire(e, trigger, { down: true });
  };

  const up = (e: t.PointerSyntheticEvent) => {
    if (!downRef.current) return;
    downRef.current = false;
    const trigger = wrangle.pointerEvent(e);
    setDown(false);
    args.onUp?.(trigger);
    drag.cancel();
    fire(e, trigger, { down: false });
  };

  const cancel = (e: t.PointerSyntheticEvent) => {
    if (!downRef.current) return;
    downRef.current = false;
    const trigger = wrangle.pointerEvent(e);
    setDown(false);
    args.onCancel?.(trigger);
    drag.cancel();
    fire(e, trigger, { down: false });
  };

  const onPointerDown: React.PointerEventHandler = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    down(e);
  };

  const onPointerUp: React.PointerEventHandler = (e) => {
    releasePointerCapture(e);
    up(e);
  };

  const onPointerCancel: React.PointerEventHandler = (e) => {
    releasePointerCapture(e);
    cancel(e);
  };

  const onLostPointerCapture: React.PointerEventHandler = (e) => {
    cancel(e);
  };

  /**
   * HANDLERS: Touch helpers (mobile):
   */
  const onTouchStart: React.TouchEventHandler = (ev) => {
    over(true)(ev);
    down(ev);
  };
  const onTouchEnd: React.TouchEventHandler = (ev) => {
    up(ev);
    over(false)(ev);
  };
  const onTouchCancel: React.TouchEventHandler = (ev) => {
    cancel(ev);
    over(false)(ev);
  };

  /**
   * HANDLERS: Focus:
   */
  const focused = (isFocused: boolean) => {
    const handler: React.FormEventHandler = (e) => setFocused(isFocused);
    return handler;
  };

  /**
   * Combine handlers:
   */
  const pointerHandlers: t.PointerHookMouseHandlers | t.PointerHookTouchHandlers = isTouch
    ? { onTouchStart, onTouchEnd, onTouchCancel }
    : {
        onPointerDown,
        onPointerUp,
        onPointerCancel,
        onLostPointerCapture,
        onPointerEnter: over(true),
        onPointerLeave: over(false),
      };

  const focusHanders: t.PointerHookFocusHandlers = {
    onFocus: focused(true),
    onBlur: focused(false),
  };
  const handlers: t.PointerHookHandlers = {
    ...pointerHandlers,
    ...focusHanders,
    ...dragdrop.handlers,
  };

  /**
   * API:
   */
  return {
    handlers,
    is: flags(),
    drag: drag.pointer,
    dragdrop: dragdrop.pointer,
    reset() {
      downRef.current = false;
      setFocused(false);
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

  pointerEvent(e: t.PointerSyntheticEvent): t.PointerEvent {
    const point = wrangle.clientPoint(e);
    return {
      type: e.type,
      synthetic: e,
      client: point,
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

  clientPoint(e: t.PointerSyntheticEvent): t.Point {
    if (wrangle.isTouchEvent(e)) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      return { x: touch?.clientX ?? -1, y: touch?.clientY ?? -1 };
    }

    return { x: e.clientX ?? -1, y: e.clientY ?? -1 };
  },

  isTouchEvent(e: t.PointerSyntheticEvent): e is React.TouchEvent {
    return 'changedTouches' in e;
  },
} as const;
