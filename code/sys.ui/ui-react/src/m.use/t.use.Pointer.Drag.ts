import type { t } from './common.ts';

/**
 * Hook Factory: keep track of a mouse drag operation.
 */
export type UsePointerDrag = (props?: t.UsePointerDragArgs) => t.PointerDragHook;

/**
 * Properties passed to the `usePointerDrag` hook.
 */
export type UsePointerDragArgs = { onDrag?: t.UsePointerDragHandler };

/**
 * Hook: information about a mouse drag operation.
 */
export type PointerDragHook = {
  readonly is: { readonly dragging: boolean };
  readonly enabled: boolean;
  readonly pointer?: t.PointerSnapshot;
  start(): void;
  cancel(): void;
};

/**
 * Event handler for a mouse-drag operation.
 */
export type UsePointerDragHandler = (e: UsePointerDragHandlerArgs) => void;
/** Argument supplied to the mouse-drag handler. */
export type UsePointerDragHandlerArgs = t.PointerSnapshot & { cancel(): void };
