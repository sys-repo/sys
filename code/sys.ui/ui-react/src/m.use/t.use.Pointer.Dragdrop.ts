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
  readonly active: boolean;
  readonly is: { readonly dragging: boolean };
  readonly pointer?: t.PointerDragdropSnapshot;
  readonly handlers?: {
    onDragEnter: React.DragEventHandler;
    onDragOver: React.DragEventHandler;
    onDragLeave: React.DragEventHandler;
    onDrop: React.DragEventHandler;
  };
  start(): void;
  cancel(): void;
};

/**
 * Handler coolback for drag-n-drop operations.
 */
export type UsePointerDragdropHandler = (e: t.PointerDragdropSnapshot) => void;
/** Drag-n-drop event arguments. */
export type PointerDragdropSnapshot = t.PointerSnapshot & {
  /** The drag-n-drop operation that tiggered the snapshot event. */
  readonly action: 'Drag' | 'Drop';
  readonly is: { drag: boolean; drop: boolean };
  /** Files under the cursor (empty array during plain drag-over). */
  readonly files: File[];
};
