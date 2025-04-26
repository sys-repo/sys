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
 *   useSizeObserver,
 *   useLoading,
 * } from '@sys/ui-react/use';
 * ```
 */
export { useClickInside, useClickOutside } from './use.Click.ts';
export { useDist } from './use.Dist.ts';
export { useIsTouchSupported } from './use.Is.TouchSupported.ts';
export { useLoading } from './use.Loading.ts';
export { useMouseDrag } from './use.Mouse.Drag.ts';
export { useMouse } from './use.Mouse.ts';
export { useSizeObserver } from './use.SizeObserver.tsx';
export {
  useVisibilityThreshold,
  useVisibilityThresholdX,
  useVisibilityThresholdY,
} from './use.VisibilityThreshold.ts';
