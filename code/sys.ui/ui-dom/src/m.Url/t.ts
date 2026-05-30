import type { t } from './common.ts';

/**
 * Tools for working with the URL (browser location) in the DOM
 */
export type DomUrl = t.ImmutableUrl.Lib & {
  /**
   * Bind an immutable URL ref to window.location via the History API.
   *
   * This is a one-way binding: immutable URL ref → window.location.
   */
  bindToWindow(ref: t.ImmutableUrl.RefReadonly, options?: t.DomUrlBindOptions): DomUrlBinding;
};

/**
 * Options for binding an immutable URL ref to window.location.
 */
export type DomUrlBindOptions = {
  /**
   * How to update the browser history stack:
   * - 'replace' (default): replace the current entry.
   * - 'push': push a new entry on each change.
   */
  readonly mode?: 'replace' | 'push';

  /**
   * Optional Until handle to tie the underlying Immutable events
   * lifecycle into a broader teardown (eg. component unmount).
   */
  readonly until?: t.UntilInput;
};

/**
 * Handle returned from binding an immutable URL ref to window.location.
 */
export type DomUrlBinding = t.Lifecycle & {
  readonly ref: t.ImmutableUrl.Ref;
};
