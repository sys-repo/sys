import { type t } from './common.ts';

/**
 * Layout breakpoint calculation.
 */
export const LayoutBreakpoint = {
  from(width?: number): t.Breakpoint {
    const name = LayoutBreakpoint.name(width);
    const is = LayoutBreakpoint.is(name);
    return { name, is };
  },

  name(width?: number): t.BreakpointName {
    if (width == null || width < 0) return 'UNKNOWN'; // NB: pre useSizeObserver initial measurement.
    if (width <= 430) return 'Mobile';
    if (width <= 767) return 'Intermediate';
    return 'Desktop';
  },

  is(name: t.BreakpointName): t.Breakpoint['is'] {
    return {
      ready: name !== 'UNKNOWN',
      mobile: name === 'Mobile',
      intermediate: name === 'Intermediate',
      desktop: name === 'Desktop',
    };
  },
} as const;
