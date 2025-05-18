import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { type t } from './common.ts';

/**
 * Calculates horizontal visibility threshold and hysteresis.
 */
export const useVisibilityThresholdX: t.UseVisibilityThresholdX = (
  { refs, containerReady = true, containerWidth, offsetX = 0, hysteresisX = 5 },
  deps = [],
) => {
  const measure = useMeasure(refs, (el) => el.offsetWidth);
  return useAxis(measure, containerReady, containerWidth, offsetX, hysteresisX, deps);
};

/**
 * Calculates vertical visibility threshold and hysteresis.
 */
export const useVisibilityThresholdY: t.UseVisibilityThresholdY = (
  { refs, containerReady = true, containerHeight, offsetY = 0, hysteresisY = 5 },
  deps = [],
) => {
  const measure = useMeasure(refs, (el) => el.offsetHeight);
  return useAxis(measure, containerReady, containerHeight, offsetY, hysteresisY, deps);
};

/**
 * Combines the X and Y hooks into a full 2D visibility threshold.
 */
export const useVisibilityThreshold: t.UseVisibilityThreshold = (args, deps = []) => {
  const x = useVisibilityThresholdX(args, deps);
  const y = useVisibilityThresholdY(args, deps);
  const visible = x.visible && y.visible;
  return { x, y, visible };
};

/**
 * Internal:
 */
const useMeasure = (
  refs: React.RefObject<HTMLElement>[],
  measureFn: (el: HTMLElement) => t.Pixels,
): (() => t.Pixels) => {
  return useCallback(
    () =>
      refs.reduce((sum, ref) => {
        const el = ref.current;
        return el ? sum + measureFn(el) : sum;
      }, 0 as t.Pixels),
    [refs, measureFn],
  );
};

/**
 * 1D threshold + hysteresis logic.
 */
function useAxis(
  measure: () => number,
  ready: boolean,
  size: number,
  offset: number,
  hysteresis: number,
  deps: unknown[],
) {
  const [threshold, setThreshold] = useState(0);
  const [visible, setVisible] = useState(false);

  const updateThreshold = useCallback(() => {
    const value = measure() + offset;
    setThreshold((prev) => (prev !== value ? value : prev));
  }, [measure, offset]);

  useLayoutEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(updateThreshold);
    return () => cancelAnimationFrame(id);
  }, [ready, updateThreshold, ...deps]);

  useEffect(() => {
    if (visible) {
      if (size < threshold - hysteresis) setVisible(false);
    } else {
      if (size > threshold + hysteresis) setVisible(true);
    }
  }, [size, threshold, hysteresis, visible]);

  return {
    threshold,
    visible,
  };
}
