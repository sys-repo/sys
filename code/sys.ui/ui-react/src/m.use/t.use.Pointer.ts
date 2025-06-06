import type { t } from './common.ts';

type M = React.MouseEventHandler;
type T = React.TouchEventHandler;

/**
 * Hook Factory: keep track of mouse events for an HTML element
 */
export type UsePointer = (props?: t.PointerHookProps) => t.PointerHook;

/**
 * Hook: keep track of mouse events for an HTML element.
 * Usage:
 *
 *     const pointer = userPointer();
 *     <div {...pointer.handlers} />
 */
export type PointerHook = {
  readonly handlers: t.PointerHookHandlers;
  readonly is: {
    readonly over: boolean;
    readonly down: boolean;
    readonly dragging: boolean;
  };
  readonly drag?: t.PointerMovement;
  reset(): void;
};

/** Handlers used by the mouse pointer */
export type PointerHookHandlers = PointerHookMouseHandlers | PointerHookTouchHandlers;
export type PointerHookMouseHandlers = {
  readonly onMouseDown: M;
  readonly onMouseUp: M;
  readonly onMouseEnter: M;
  readonly onMouseLeave: M;
};
export type PointerHookTouchHandlers = {
  readonly onTouchStart: T;
  readonly onTouchEnd: T;
  readonly onTouchCancel: T;
};

/**
 * Properties passed to the `userPointer` hook.
 */
export type PointerHookProps = {
  onDown?: PointerEventHandler;
  onUp?: PointerEventHandler;
  onEnter?: PointerEventHandler;
  onLeave?: PointerEventHandler;
  onDrag?: t.UsePointerDragHandler;
};

/**
 * Information about a pointer (mouse/touch)event.
 */
export type PointerEventHandler = (e: PointerEvent) => void;
export type PointerEvent = {
  readonly type: React.PointerEvent['type'];
  readonly synthetic: React.PointerEvent;
  readonly modifiers: t.KeyboardModifierFlags;
  readonly client: t.Point;
  cancel(): void;
  preventDefault(): void;
  stopPropagation(): void;
};
