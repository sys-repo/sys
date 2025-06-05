/**
 * @module
 * Common react hooks.
 *
 * @example
 *
 * ```ts
 * import {
 *   useMouse,
 *   useMouseDrag,
 *   useClickInside,
 *   useClickOutside,
 *   useRedraw,
 *   useSizeObserver,
 *   useLoading,
 * } from '@sys/ui-react/use';
 * ```
 */
export { useClickInside, useClickOutside } from './use.Click.ts';
export { useDist } from './use.Dist.ts';
export { useIsTouchSupported } from './use.Is.TouchSupported.ts';
export { useLoading } from './use.Loading.ts';
export { useMouseDrag } from './use.Pointer.Drag.ts';
export { useMouse } from './use.Pointer.ts';
export { useRedraw } from './use.Redraw.ts';
export { useSizeObserver } from './use.SizeObserver.tsx';
export {
  useVisibilityThreshold,
  useVisibilityThresholdX,
  useVisibilityThresholdY,
} from './use.VisibilityThreshold.ts';
