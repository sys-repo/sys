import React from 'react';

export type UsePulseOptions = {
  min?: number;
  max?: number;
  duration?: number;
};

/**
 * Pulse a numeric opacity value between two bounds while enabled.
 */
export function usePulse(enabled: boolean, options: UsePulseOptions = {}) {
  const { min = 0.2, max = 0.6, duration = 1600 } = options;
  const [value, setValue] = React.useState(1);

  React.useEffect(() => {
    if (!enabled) {
      setValue(1);
      return;
    }

    const interval = Math.max(1, duration / 2);
    setValue(min);
    let next = max;
    const timer = globalThis.setInterval(() => {
      setValue(next);
      next = next === max ? min : max;
    }, interval);

    return () => globalThis.clearInterval(timer);
  }, [duration, enabled, max, min]);

  return value;
}
