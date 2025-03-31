import type { t } from './common.ts';

/**
 * Hook Factory: keep track of a mouse drag operation.
 */
export type UseMouseDrag = (props?: t.MouseDragHookProps) => t.MouseDragHook;

/**
 * Properties passed to the `useMouseDrag` hook.
 */
export type MouseDragHookProps = { onDrag?: t.UseMouseDragHandler };

/**
 * Hook: information about a mouse drag operation.
 */
export type MouseDragHook = {
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
