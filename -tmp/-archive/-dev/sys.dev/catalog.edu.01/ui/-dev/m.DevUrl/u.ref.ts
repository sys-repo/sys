import { type t, Url } from '../common.ts';

const TRUTHY = ['', '1', 'true', 'yes', 'on'] as const;
const FALSY = ['0', 'false', 'no', 'off'] as const;

/**
 * Immutable DevUrl handle:
 * - `current` is the DevUrlConfig view (debug → showDebug).
 * - `change` mutates a DevUrlConfig draft, then reapplies it to the URL.
 *
 * The underlying ref shape comes from the core Url.dsl.
 */
export function makeDevUrlRef(init: t.UrlLike | t.StringUrl) {
  return Url.dsl<t.DevUrlConfig>(init, toConfig, (urlRef, config) => {
    urlRef.change((url) => applyConfig(url, config));
  });
}

/**
 * DSL:
 */
function toConfig(u: URL): t.DevUrlConfig {
  const q = u.searchParams;

  if (!q.has('debug')) return { showDebug: null };

  const value = q.get('debug');
  const normalized = (value ?? '').toLowerCase();

  if (FALSY.includes(normalized as (typeof FALSY)[number])) {
    return { showDebug: false };
  }

  if (TRUTHY.includes(normalized as (typeof TRUTHY)[number])) {
    return { showDebug: true };
  }

  // Fallback: key exists but value is weird → treat as true.
  return { showDebug: true };
}

function applyConfig(u: URL, config: t.DevUrlConfig): void {
  const q = u.searchParams;
  const v = config.showDebug;

  if (v === null) {
    q.delete('debug');
  } else {
    q.set('debug', String(v));
  }
}
