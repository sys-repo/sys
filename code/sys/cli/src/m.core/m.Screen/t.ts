import type { t } from '../common.ts';

/**
 * Tools for working with a terminal screen.
 */
export declare namespace CliScreen {
  /** Terminal screen helper library contract. */
  export type Lib = {
    /** Measure the terminal’s current width and height in character cells. */
    size(): Size;

    /** Listen to events related to the terminal screen. */
    events(until?: t.UntilInput): Events;
  };

  /** Current terminal dimensions in character cells. */
  export type Size = {
    /** Terminal width in character cells. */
    readonly width: number;
    /** Terminal height in character cells. */
    readonly height: number;
  };

  /** Terminal screen events. */
  export type Events = t.Lifecycle & {
    readonly $: t.Observable<Event>;
    readonly resize$: t.Observable<SizeChanged>;
  };

  /** Terminal screen event union. */
  export type Event = SizeChanged;

  /** Terminal resize event. */
  export type SizeChanged = {
    /** Terminal resize event discriminant. */
    readonly kind: 'size:changed';
    /** Terminal size before the resize. */
    readonly before: Size;
    /** Terminal size after the resize. */
    readonly after: Size;
  };
}
