import { useEffect } from 'react';
import { type t, Breakpoint, Obj, useSizeObserver } from './common.ts';

export function useScreensize(state?: t.AppSignals) {
  const p = state?.props;
  const size = useSizeObserver();
  const breakpoint = Breakpoint.fromWidth(size.rect?.width);

  useEffect(() => {
    if (p) p.screen.breakpoint.value = breakpoint.name;
  }, [breakpoint.name]);

  /**
   * API
   */
  return Obj.extend(size, {
    ready: size.ready && breakpoint.is.ready,
    breakpoint,
  });
}
