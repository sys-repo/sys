import { type t, Rx } from './common.ts';

/**
 * Bind a UrlRef to window.location via the History API.
 *
 * One-way flow:
 *   UrlRef.current (and its change events) → window.location
 *
 * No attempt is made to listen to popstate/hashchange or mutate the
 * UrlRef from DOM events; that belongs in a higher-level integrator.
 */
export function bindToWindow(ref: t.UrlRef, opts: t.DomUrlBindOptions = {}): t.DomUrlBinding {
  const { mode = 'replace', until } = opts;
  const life = Rx.lifecycle(opts.until);

  /**
   * No-op binding when not in a browser environment.
   * This keeps call-sites safe in SSR/tests.
   */
  if (typeof window === 'undefined' || !window.history || !window.location) {
    return Rx.toLifecycle<t.DomUrlBinding>(life, { ref });
  }

  const { history, location } = window;
  const syncWindow = (url: URL) => {
    const nextHref = url.href;

    // Avoid redundant updates.
    if (location.href === nextHref) return;

    // Same-origin → use History API for soft navigation.
    if (url.origin === location.origin) {
      const next = `${url.pathname}${url.search}${url.hash}`;
      const method = mode === 'push' ? 'pushState' : 'replaceState';
      history[method](history.state, '', next);
      return;
    }

    // Cross-origin → fall back to a hard navigation.
    location.href = nextHref;
  };

  // Initial sync from the current `UrlRef` snapshot.
  syncWindow(ref.current);

  // Subscribe to immutable change events and mirror into `window.location`.
  const events = ref.events(life);
  events.$.subscribe((change) => syncWindow(change.after));

  /**
   * API:
   */
  return Rx.toLifecycle<t.DomUrlBinding>(life, { ref });
}
