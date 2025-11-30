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
  readonly width: number;
  readonly height: number;
};

/**
 * Terminal screen events.
 */
export type CliScreenEvents = t.Lifecycle & { readonly $: t.Observable<CliScreenSizeEvent> };
export type CliScreenSizeEvent = CliScreenSizeChanged;
export type CliScreenSizeChanged = {
  readonly kind: 'size:changed';
  readonly before: t.CliScreenSize;
  readonly after: t.CliScreenSize;
};
