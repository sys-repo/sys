import React from 'react';
import { type t } from '../common.ts';

/**
 * useFunction
 *
 * Returns a stable callback that always executes the latest `fn`.
 *
 * Useful for passing functions into effects or subscriptions
 * without causing unnecessary re-subscribes.
 */
export const useFunction: t.UseFunction = <T extends (...args: any[]) => unknown>(
  fn: T | undefined,
) => {
  const ref = React.useRef(fn);
  React.useEffect(() => void (ref.current = fn), [fn]);

  return React.useCallback(
    ((...args: unknown[]) => {
      return ref.current?.(...args);
    }) as T,
    [],
  );
};
