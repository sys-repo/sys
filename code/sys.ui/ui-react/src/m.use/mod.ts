/**
 * Common react hooks.
 * @module
 *
 * @example
 *
 * ```ts
 * import {
 *   usePointer,
 *   usePointerDrag,
 *   usePointerDragDrop,
 *   useClickInside,
 *   useClickOutside,
 *   useRedraw,
 *   useSizeObserver,
 *   useLoading,
 * } from '@sys/ui-react/use';
 * ```
 */
export * from '../m.use.Pointer/mod.ts';

export { useDebouncedValue } from './use.DebouncedValue.ts';
export { useDist } from './use.Dist.ts';
export { useIsTouchSupported } from './use.Is.TouchSupported.ts';
export { useLoading } from './use.Loading.ts';
export { useRedraw } from './use.Redraw.ts';
export { useSizeObserver } from './use.SizeObserver.tsx';
export {
  useVisibilityThreshold,
  useVisibilityThresholdX,
  useVisibilityThresholdY,
} from './use.VisibilityThreshold.ts';
