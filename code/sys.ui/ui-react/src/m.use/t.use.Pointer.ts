import type { t } from './common.ts';

type M = React.MouseEventHandler;
type T = React.TouchEventHandler;

/**
 * Hook factory: track pointer (mouse/touch) state for an HTML element.
 *
 * Usage:
 *   const pointer = usePointer();
 *   <div {...pointer.handlers} />
 */
export type UsePointer = (input?: t.PointerHookArgs | t.PointerEventsHandler) => t.PointerHook;
/** Arguments passed to the `usePointer` hook. */
export type PointerHookArgs = {
  on?: PointerEventsHandler;
  onDown?: PointerEventHandler;
  onUp?: PointerEventHandler;
  onEnter?: PointerEventHandler;
  onLeave?: PointerEventHandler;
  onDrag?: t.UsePointerDragHandler;
  onDragdrop?: t.UsePointerDragdropHandler;
};

/**
 * Pointer hook instance:
 */
export type PointerHook = {
  readonly handlers: t.PointerHookHandlers;
  readonly is: t.PointerHookFlags;
  /** Drag-movement data for the current gesture (undefined if idle). */
  // readonly dragdrop?: t.PointerMovement;
  /** Reset all internal state (over, down, dragging). */
  reset(): void;
};

/**
 * Pointer flags:
 */
export type PointerHookFlags = {
  readonly over: boolean;
  readonly down: boolean;
  readonly dragdropping: boolean;
  readonly dragging: boolean;
};

/**
 * Event handler callbacks:
 */
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
 * Individual pointer event:
 */
export type PointerEventHandler = (e: PointerEvent) => void;
/** Information about a specific pointer (mouse/touch) event. */
export type PointerEvent = {
  readonly type: React.PointerEvent['type'];
  readonly synthetic: React.PointerEvent;
  readonly modifiers: t.KeyboardModifierFlags;
  readonly client: t.Point;
  cancel(): void;
  /** Shorthand for `synthetic.preventDefault()` */
  preventDefault(): void;
  /** Shorthand for `synthetic.stopPropagation()` */
  stopPropagation(): void;
};

/**
 * Aggregate event fired for *every* pointer-related change.
 */
export type PointerEventsHandler = (e: PointerEventsArg) => void;
export type PointerEventsArg = {
  readonly synthetic: PointerEvent;
  readonly is: PointerHookFlags;
  cancel(): void;
};

/**
 * A snapshot of the pointer during a drag operation.
 */
export type PointerSnapshot = {
  /** Viewport-relative position. */
  client: t.Point;

  /** Mouse button currently down (0 = left, 1 = middle, 2 = right). */
  button: number;

  /** Keyboard-modifier snapshot. */
  modifiers: t.KeyboardModifierFlags;

  /** Δx / Δy since the previous drag frame. */
  movement: t.Point; // e.g. { x: 12, y: -4 }

  /** Absolute positions in various co-ordinate spaces. */
  screen: t.Point; // physical screen (event.screenX/Y)
};
