import type { RefObject, MouseEventHandler } from 'react';
import type { t } from '../common.ts';

type E = HTMLElement;
type Div = HTMLDivElement;
type M = MouseEventHandler;
type MouseCallback = (e: MouseEvent) => void;

/**
 * Properties passed to the `useMouse` hook.
 */
export type UseMouseProps = {
  onDown?: M;
  onUp?: M;
  onEnter?: M;
  onLeave?: M;
  onDrag?: UseMouseDragHandler;
};

/**
 * Hook Factory: keep track of mouse events for an HTML element
 */
export type UseMouseHook = (props?: t.UseMouseProps) => t.UseMouse;

/**
 * Hook: keep track of mouse events for an HTML element.
 * Usage:
 *
 *     const mouse = useMouse();
 *     <div {...mouse.handlers} />
 */
export type UseMouse = {
  readonly is: { readonly over: boolean; readonly down: boolean; readonly dragging: boolean };
  readonly handlers: { onMouseDown: M; onMouseUp: M; onMouseEnter: M; onMouseLeave: M };
  readonly drag?: t.MouseMovement;
  reset(): void;
};

/**
 * Hook Factory: keep track of a mouse drag operation.
 */
export type UseMouseDragHook = (props?: t.UseMouseDragProps) => t.UseMouseDrag;

/**
 * Properties passed to the `useMouseDrag` hook.
 */
export type UseMouseDragProps = { onDrag?: t.UseMouseDragHandler };

/**
 * Hook: information about a mouse drag operation.
 */
export type UseMouseDrag = {
  readonly is: { readonly dragging: boolean };
  readonly enabled: boolean;
  readonly movement?: t.MouseMovement;
  start(): void;
  cancel(): void;
};

/**
 * Hook: information about the movement of a mouse cursor.
 */
export type MouseMovement = {
  readonly x: number;
  readonly y: number;
  readonly movement: t.Point;
  readonly client: t.Point;
  readonly page: t.Point;
  readonly offset: t.Point;
  readonly screen: t.Point;
  readonly button: number;
  readonly modifiers: t.KeyboardModifierFlags;
};

/**
 * Event handler for a mouse-drag operation.
 */
export type UseMouseDragHandler = (e: UseMouseDragHandlerArgs) => void;

/**
 * Agrument supplied to the mouse-drag handler.
 */
export type UseMouseDragHandlerArgs = MouseMovement & { cancel(): void };

/**
 * Hook: information about a mouse click operations
 */
export type UseClickHook<T extends E = Div> = (input: t.UseClickInput<T>) => UseClick<T>;

/**
 * Hook: Monitors for click events outside the given element.
 * Usage:
 *    Useful for clicking away from modal dialogs or popups.
 */
export type UseClickOutsideHook<T extends E = Div> = UseClickHook<T>;

/**
 * Hook: Monitors for click events within the given element.
 * Usage:
 *    Useful for clicking away from modal dialogs or popups.
 */
export type UseClickInsideHook<T extends E = Div> = UseClickHook<T>;

/**
 * Input passed to the UseClick hook.
 */
export type UseClickInput<T extends E> = t.UseClickProps<T> | MouseCallback;

/**
 * Hook: information about a mouse click operations
 */
export type UseClick<T extends E> = {
  readonly ref: RefObject<T>;
  readonly stage: t.UseClickStage;
};

/**
 * Properties passed to the `UseClick` hook.
 */
export type UseClickProps<T extends E> = {
  stage?: t.UseClickStage;
  ref?: RefObject<T>;
  callback?: MouseCallback;
};

export type UseClickStage = 'down' | 'up';

/**
 * Hook Factory: monitor size changes to a DOM element using [ResizeObserver].
 */
export type UseSizeObserverHook = <T extends HTMLElement>(
  externalRef?: React.Ref<T>,
) => t.UseSizeObserver<T>;

/**
 * Hook: monitor size changes to a DOM element using [ResizeObserver].
 */
export type UseSizeObserver<T extends HTMLElement> = {
  /** Callback ref to be assigned to the element to observe. */
  ref: React.RefCallback<T>;
  /** The latest dimensions of the element (or null if not measured yet). */
  size?: DOMRectReadOnly;
};
