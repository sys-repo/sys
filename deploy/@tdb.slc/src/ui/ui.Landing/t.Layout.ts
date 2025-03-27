import { type t } from './common.ts';

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
