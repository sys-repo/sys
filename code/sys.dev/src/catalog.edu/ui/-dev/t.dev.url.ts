import type { t } from './common.ts';

/**
 * Public DevUrl library surface.
 *
 * - `ref` is pure: URL-like in → DevUrl DSL (no DOM).
 * - `forWindow` is the “old make” replacement:
 *   derives from window.location, binds to the DOM, returns the same DSL.
 */
export type DevUrlLib = {
  /**
   * Pure DevUrlConfig DSL around a URL-like input.
   */
  ref(init: t.UrlLike | t.StringUrl): t.DevUrlDsl;

  /**
   * Convenience: derive from `win.location.href` and
   * bind the underlying UrlRef to `window.location` via @sys/ui-dom.
   *
   * This is effectively the spiritual replacement for the old `makeDevUrl`.
   */
  forWindow(win: Window, options?: t.DomUrlBindOptions): t.DevUrlDsl;
};

/**
 * Instance of a Dev-harness URL/DSL.
 */
export type DevUrlDsl = t.UrlDslRef<t.DevUrlConfig>;

/**
 * Dev-harness URL/DSL.
 */
export type DevUrlConfig = {
  showDebug: boolean | null;
};

/**
 * Value type for dev URL toggles.
 * `null` means "not specified" (param removed).
 */
export type DevToggle = boolean | null;
