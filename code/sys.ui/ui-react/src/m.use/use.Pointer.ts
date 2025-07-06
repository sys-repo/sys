import React, { useState, useEffect } from 'react';

import type { t } from './common.ts';
import { useIsTouchSupported } from './use.Is.TouchSupported.ts';
import { usePointerDrag } from './use.Pointer.Drag.ts';
import { toDragdropSnapshot, usePointerDragdrop } from './use.Pointer.Dragdrop.ts';

/**
 * Hook: pointer events + optional file drag/drop.
 *
 *   const pointer = usePointer({ onDrag, onDragdrop });
 *   <div {...pointer.handlers} />
 */
export const usePointer: t.UsePointer = (input) => {
  const args = wrangle.args(input);
  const { onDrag, onDragdrop } = args;

  /**
   * Hooks:
   */
  const [isDown, setDown] = useState(false);
  const [isOver, setOver] = useState(false);
  const isTouch = useIsTouchSupported();

  const drag = usePointerDrag({ onDrag });
  const dragdrop = usePointerDragdrop({ onDragdrop });
  const flags = (patch?: Partial<t.PointerHookFlags>): t.PointerHookFlags => ({
    over: patch?.over ?? isOver,
    down: patch?.down ?? isDown,
    dragging: drag.is.dragging,
    dragdropping: dragdrop.is.dragging,
  });

  /**
   * Effect: When the low-level drag stops (mouse-up outside) reset "down".
   */
  useEffect(() => {
    if (!drag.is.dragging) setDown(false);
  }, [drag.is.dragging]);

  /**
   * General helpers:
   */
  const firePointer = (
    synthetic: React.PointerEvent,
    trigger: t.PointerEvent,
    patch: Partial<t.PointerHookFlags>,
  ) => {
    const cancel = () => {
      synthetic.preventDefault();
      synthetic.stopPropagation();
    };
    args.on?.({ is: flags(patch), synthetic: trigger, cancel });
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
      if (drag.enabled) drag.start();
    } else {
      args.onUp?.(trigger);
      drag.cancel();
    }

    firePointer(e, trigger, { down: pressed });
  };

  /**
   * File drag-n-drop:
   */
  // Enter element - start tracking:
  const onDragEnter: React.DragEventHandler = (e) => {
    if (!onDragdrop) return;
    e.preventDefault();
    if (!dragdrop.is.dragging) dragdrop.start();
  };

  // Continuous drag over target:
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

  // Leave element - stop tracking:
  const onDragLeave: React.DragEventHandler = (e) => {
    if (!onDragdrop) return;
    e.preventDefault();

    // Ignore bubbled leave events from children.
    // Act only when really outside.
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) return;

    dragdrop.cancel();
  };

  // Element dropped - stop tracking & deliver files:
  const onDrop: React.DragEventHandler = (e) => {
    if (!onDragdrop) return;
    e.preventDefault();
    dragdrop.cancel();

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
   * Compbines handlers:
   */
  const pointerHandlers = isTouch
    ? { onTouchStart, onTouchEnd, onTouchCancel: onTouchEnd }
    : {
        onMouseDown: down(true),
        onMouseUp: down(false),
        onMouseEnter: over(true),
        onMouseLeave: over(false),
      };

  const dragdropHandlers = onDragdrop && {
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };

  /**
   * API:
   */
  return {
    handlers: { ...pointerHandlers, ...dragdropHandlers },
    is: flags(),
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
