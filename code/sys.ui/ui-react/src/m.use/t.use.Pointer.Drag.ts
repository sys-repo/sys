import type { t } from './common.ts';

/**
 * Hook Factory: keep track of a mouse drag operation.
 */
export type UsePointerDrag = (props?: t.PointerDragHookProps) => t.PointerDragHook;

/**
 * Properties passed to the `usePointerDrag` hook.
 */
export type PointerDragHookProps = { onDrag?: t.UsePointerDragHandler };

/**
 * Hook: information about a mouse drag operation.
 */
export type PointerDragHook = {
  readonly is: { readonly dragging: boolean };
  readonly enabled: boolean;
  readonly movement?: t.PointerMovement;
  start(): void;
  cancel(): void;
};

/**
 * Information about the movement of a mouse cursor.
 */
export type PointerMovement = {
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
export type UsePointerDragHandler = (e: UsePointerDragHandlerArgs) => void;

/**
 * Agrument supplied to the mouse-drag handler.
 */
export type UsePointerDragHandlerArgs = PointerMovement & { cancel(): void };
