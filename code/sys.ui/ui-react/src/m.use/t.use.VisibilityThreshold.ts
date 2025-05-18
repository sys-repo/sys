import type { t } from './common.ts';

/**
 * Calculates horizontal and vertical visibility thresholds
 * from measured refs and reports axis-specific and combined visibility.
 */
export type UseVisibilityThreshold = (args: Args, deps: unknown[]) => VisibilityThreshold2D;
export type UseVisibilityThresholdX = (args: ArgsX, deps: unknown[]) => VisibilityThreshold1D;
export type UseVisibilityThresholdY = (args: ArgsY, deps: unknown[]) => VisibilityThreshold1D;

/**
 * Args for useVisibilityThreshold:
 * - refs: elements to measure (width + height).
 * - containerReady: only measure once ready.
 * - containerWidth/Height: current container dimensions.
 * - offsetX/Y: extra padding on each axis - @default 0
 * - hysteresisX/Y: flicker buffer on each axis - @default 5
 */
type VisibilityThresholdArgs = {
  refs: React.RefObject<HTMLElement>[];
  containerReady?: boolean;
  containerWidth: t.Pixels;
  containerHeight: t.Pixels;
  offsetX?: t.Pixels;
  offsetY?: t.Pixels;
  hysteresisX?: t.Pixels;
  hysteresisY?: t.Pixels;
};

type Args = VisibilityThresholdArgs;
type ArgsX = Omit<Args, 'containerHeight' | 'offsetY' | 'hysteresisY'>;
type ArgsY = Omit<Args, 'containerWidth' | 'offsetX' | 'hysteresisX'>;

/**
 * Hook result:
 */
export type VisibilityThreshold1D = { threshold: t.Pixels; visible: boolean };
export type VisibilityThreshold2D = {
  x: { threshold: t.Pixels; visible: boolean };
  y: { threshold: t.Pixels; visible: boolean };
  visible: boolean;
};
