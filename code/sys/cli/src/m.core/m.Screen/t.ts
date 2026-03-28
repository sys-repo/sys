import type { t } from '../common.ts';

/**
 * Tools for working with a terminal screen.
 */
export type CliScreenLib = {
  /** Measure the terminal’s current width and height in character cells. */
  size(): t.CliScreenSize;

  /** Listen to events related to the terminal screen. */
  events(until?: t.UntilInput): t.CliScreenEvents;
};

/** Current terminal dimensions in character cells. */
export type CliScreenSize = {
  /** Terminal width in character cells. */
  readonly width: number;
  /** Terminal height in character cells. */
  readonly height: number;
};

/**
 * Terminal screen events.
 */
export type CliScreenEvents = t.Lifecycle & {
  readonly $: t.Observable<t.CliScreenEvent>;
  readonly resize$: t.Observable<t.CliScreenSizeChanged>;
};
/** Terminal screen event union. */
export type CliScreenEvent = CliScreenSizeChanged;
/** Terminal resize event. */
export type CliScreenSizeChanged = {
  /** Terminal resize event discriminant. */
  readonly kind: 'size:changed';
  /** Terminal size before the resize. */
  readonly before: t.CliScreenSize;
  /** Terminal size after the resize. */
  readonly after: t.CliScreenSize;
};
