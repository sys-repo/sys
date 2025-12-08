import { type t, AliasResolver, Is } from '../common.ts';

/**
 * Resolve an alias-based path using:
 *   - a local resolver (subject slug)
 *   - a root/index resolver (program index)
 *
 * Semantics:
 *   - all alias expansion starts in `local`
 *   - `:index` is a control token: "switch to root resolver"
 *   - once in root, resolution stays there (no switching back)
 */
export const resolvePath: t.ResolvePathFn = (raw, local, index) => {
  if (!Is.str(raw)) return undefined;
  if (!local) return undefined;

  const localMap = withoutIndex(local.alias);
  const steps: t.Alias.Expand.Chain.Step[] = [];

  /**
   * 1) First phase: expand within local resolver (subject-level aliases).
   *
   * Example:
   *   raw  → "/:core-videos/core 2.0-intro1.webm..."
   *   local → ":core-videos" → ":core-assets/videos"
   *         → ":core-assets" → ":index/:assets/core-2.0-intro-2025"
   *
   * Result:
   *   value     → "/:index/:assets/core-2.0-intro-2025/videos/..."
   *   remaining → [":index", ":assets"]
   */
  const first = AliasResolver.expand(raw, localMap);
  steps.push({
    value: first.value,
    used: first.used,
    remaining: first.remaining,
    alias: localMap,
  });

  let value = first.value;
  let remaining = first.remaining;

  const hasIndex = remaining.includes(':index');

  /**
   * If there is no `:index` left, or we don't have a root resolver,
   * stop after the local phase.
   */
  if (!hasIndex || !index) {
    return {
      value: normalizeResolvedPath(value),
      steps,
      remaining,
    };
  }

  /**
   * 2) Second phase: hop into root resolver.
   *
   * We strip any path segments that are exactly `:index`, then resolve
   * using the root alias map (which has :core, :p2p, :assets, ...).
   *
   * Example:
   *   value       → "/:index/:assets/core-2.0-intro-2025/videos/..."
   *   hopped      → "/:assets/core-2.0-intro-2025/videos/..."
   *   root.alias  → ":assets" → "~/Documents/.../publish/"
   *
   * Final:
   *   value       → "~/Documents/.../publish/core-2.0-intro-2025/videos/..."
   */
  const hopped = stripIndexSegments(value);
  const second = AliasResolver.expand(hopped, index.alias);

  steps.push({
    value: second.value,
    used: second.used,
    remaining: second.remaining,
    alias: index.alias,
  });

  value = second.value;
  remaining = second.remaining;

  return {
    value: normalizeResolvedPath(value),
    steps,
    remaining,
  };
};

/**
 * Return a shallow clone of the alias map with `:index` removed.
 * `:index` is treated as a control token, not a string expansion.
 */
function withoutIndex(map: t.Alias.Map): t.Alias.Map {
  const clone: Record<string, string> = {};
  for (const key in map) {
    if (key === ':index') continue;
    const value = map[key as t.Alias.Key];
    if (typeof value === 'string') clone[key] = value;
  }
  return clone as t.Alias.Map;
}

/**
 * Remove any path segments that are exactly `:index`.
 * Preserves a leading slash if present.
 */
function stripIndexSegments(value: string): string {
  const parts = value.split('/');
  const leadingSlash = parts[0] === '';
  const filtered = parts.filter((seg) => seg !== ':index' && seg !== '');
  const joined = filtered.join('/');
  return leadingSlash ? `/${joined}` : joined;
}

/**
 * Simple normalization:
 *   - collapse repeated slashes
 *   - fix leading "/~" → "~"
 */
function normalizeResolvedPath(value: string): string {
  let next = value.replace(/\/+/g, '/');
  if (next.startsWith('/~/')) next = next.slice(1);
  return next;
}
