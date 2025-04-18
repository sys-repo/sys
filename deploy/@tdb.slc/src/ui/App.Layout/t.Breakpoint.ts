import { type t } from './common.ts';

export type BreakpointSizeInput = t.NumberWidth | t.BreakpointName | t.Breakpoint;

/**
 * Library for working with breakpoints.
 */
export type BreakpointLib = {
  from(input: t.BreakpointSizeInput): t.Breakpoint;
  fromWidth(width?: number): t.Breakpoint;
  fromName(name: t.BreakpointName): t.Breakpoint;
  name(width?: number): t.BreakpointName;
  is(name: t.BreakpointName): t.Breakpoint['is'];
};

/**
 * Layout breakpoints
 */
export type BreakpointName = 'Mobile' | 'Intermediate' | 'Desktop' | 'UNKNOWN';
export type Breakpoint = {
  name: BreakpointName;
  is: {
    /** Width is -1 prior to the ResizeObserver completing it's first measure pass. */
    ready: boolean;
    /**
     * Mobile breakpoint.
     * True when the viewport width is 430px or less, typically for smartphones.
     */
    mobile: boolean;
    /**
     * Intermediate breakpoint.
     * True when the viewport width is between 431px and 767px, ideal for phablets or small tablets.
     */
    intermediate: boolean;
    /**
     * Desktop breakpoint.
     * True when the viewport width is 768px or greater, typically for desktops and larger tablets.
     */
    desktop: boolean;
  };
};
