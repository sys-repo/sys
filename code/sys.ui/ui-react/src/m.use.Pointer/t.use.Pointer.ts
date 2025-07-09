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
  dropGuard?: boolean;
};

/**
 * Pointer hook instance:
 */
export type PointerHook = {
  readonly handlers: t.PointerHookHandlers;
  readonly is: t.PointerHookFlags;
  /** Drag-movement data when dragging the element (undefined if idle). */
  readonly drag?: t.PointerDragSnapshot;
  /** Drag-movement data when drag-n-droping into the element (undefined if idle). */
  readonly dragdrop?: t.PointerDragdropSnapshot;
  /** Reset all internal state (over, down, dragging). */
  reset(): void;
};

/**
 * Pointer flags:
 */
export type PointerHookFlags = {
  readonly over: boolean;
  readonly down: boolean;
  readonly up: boolean;
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
export type PointerEvent = PointerEventCancelMethods & {
  readonly type: React.PointerEvent['type'];
  readonly synthetic: React.PointerEvent;
  readonly modifiers: t.KeyboardModifierFlags;
  readonly client: t.Point;
};

/**
 * Aggregate event fired for *every* pointer-related change.
 */
export type PointerEventsHandler = (e: PointerEventsArg) => void;
export type PointerEventsArg = PointerEventCancelMethods & {
  /**
   * React synthetic event (valid synchronously; in React 18 pooling is disabled
   * by default, but for ≤17 do not access it after the current tick).
   */
  readonly synthetic: PointerEvent;
  /** Boolean flags about the event. */
  readonly is: PointerHookFlags;
  /** Keyboard modifiers. */
  readonly modifiers: t.KeyboardModifierFlags;
};

/** Methods for cancelling an event. */
export type PointerEventCancelMethods = {
  /** Invokes both `preventDefault` and `stopPropagation`. */
  cancel(): void;
  /** Shorthand for `synthetic.preventDefault()` */
  preventDefault(): void;
  /** Shorthand for `synthetic.stopPropagation()` */
  stopPropagation(): void;
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
