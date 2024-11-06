import type { RefObject } from 'react';

export type Dropped = {
  urls: string[];
  files: DroppedFile[];
  toFiles(): File[];
};
export type DroppedFile = {
  path: string;
  data: Uint8Array;
  mimetype: string;
  toFile(path?: string): File;
};

/**
 * Hook
 */
export type DragTargetHookArgs<T extends HTMLElement> = {
  ref?: React.RefObject<T>;
  enabled?: boolean;
  suppressGlobal?: boolean; // Prevent drops anywhere else on the screen.
  onDrop?: DragTargetDropHandler;
  onDragOver?: (e: { isOver: boolean }) => void;
};

export type DragTargetHook<T extends HTMLElement> = {
  readonly ref: RefObject<T>;
  readonly is: DragTargetFlags;
  readonly dropped?: Dropped;
  reset(): void;
};

export type DragTargetFlags = {
  readonly enabled: boolean;
  readonly over: boolean;
  readonly dropped: boolean;
};

/**
 * Events
 */
export type DragTargetDropHandler = (e: DragTargetDropHandlerArgs) => void;
export type DragTargetDropHandlerArgs = Dropped;

export type DragTargetOverHandler = (e: DragTargetOverHandlerArgs) => void;
export type DragTargetOverHandlerArgs = { isOver: boolean };
