import type { t } from './common.ts';

/**
 * Hook: monitor/handle drag-n-drop operations.
 */
export type UsePointerDragdrop = (props?: UsePointerDragdropArgs) => PointerDragdropHook;
/** Arguments passed to the `usePointerDragdrop` hook. */
export type UsePointerDragdropArgs = {
  onDragdrop?: UsePointerDragdropHandler;
};

/**
 * Instance of the drag-n-drop hook.
 */
export type PointerDragdropHook = {
  readonly is: { readonly dragging: boolean };
  readonly enabled: boolean;
  start(): void;
  cancel(): void;
};

/**
 * Handler coolback for drag-n-drop operations.
 */
export type UsePointerDragdropHandler = (e: t.UsePointerDragdropHandlerArgs) => void;
/** Drag-n-drop event arguments. */
export type UsePointerDragdropHandlerArgs = t.PointerSnapshot & {
  action: 'Drag' | 'Drop';
  /** Files under the cursor (empty array during plain drag-over). */
  files: File[];
  /** Prevent default browser behaviour for this action. */
  cancel(): void;
};
