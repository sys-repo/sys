import { Rx, type t } from './common.ts';

/**
 * Bind an immutable URL ref to window.location via the History API.
 *
 * One-way flow:
 *   immutable URL ref current value (and its change events) → window.location
 *
 * No attempt is made to listen to popstate/hashchange or mutate the
 * immutable URL ref from DOM events; that belongs in a higher-level integrator.
 */
export function bindToWindow(
  ref: t.ImmutableUrl.Ref,
  opts: t.DomUrlBindOptions = {},
): t.DomUrlBinding {
  const { mode = 'replace', until } = opts;
  const life = Rx.lifecycle(until);

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

  // Initial sync from the current immutable URL ref snapshot.
  syncWindow(ref.current);

  // Subscribe to immutable change events and mirror into `window.location`.
  const events = ref.events(life);
  events.$.subscribe((change) => syncWindow(change.after));

  /**
   * API:
   */
  return Rx.toLifecycle<t.DomUrlBinding>(life, { ref });
}
