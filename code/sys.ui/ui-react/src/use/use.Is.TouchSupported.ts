import type { t } from './common.ts';

/**
 * Hook: detect if the device supports touch events.
 */
export const useIsTouchSupported: t.UseIsTouchSupported = () => {
  return typeof window !== 'undefined' && 'ontouchstart' in window;
};
