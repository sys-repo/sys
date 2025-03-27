import { type t } from './common.ts';

/**
 * Layout breakpoints calculation/helpers.
 */
export const Breakpoint = {
  from(input: t.BreakpointSizeInput): t.Breakpoint {
    if (typeof input === 'number') return Breakpoint.fromWidth(input);
    if (typeof input === 'string') return Breakpoint.fromName(input);
    return input;
  },

  fromWidth(width?: number): t.Breakpoint {
    const name = Breakpoint.name(width);
    return Breakpoint.fromName(name);
  },

  fromName(name: t.BreakpointName): t.Breakpoint {
    const is = Breakpoint.is(name);
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
