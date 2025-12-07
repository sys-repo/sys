import { type t } from './common.ts';
import { extractTokens } from './u.extractTokens.ts';

/**
 * Pure syntactic alias expansion.
 *
 * Replaces alias tokens (":key") with their mapped values.
 * Performs bounded iterative replacement to support nested aliases.
 * Never throws; always returns a result object describing what changed.
 */
export function expand(
  raw: t.Alias.RawPath,
  map: t.Alias.Map,
  opts: { maxDepth?: number } = {},
): t.Alias.Expand.Result {
  const maxDepth = opts.maxDepth ?? 8; // cycle protection
  let value = raw;
  const used: t.Alias.Key[] = [];

  for (let depth = 0; depth < maxDepth; depth++) {
    const tokens = extractTokens(value);
    if (tokens.length === 0) break;

    let replaced = false;

    for (const token of tokens) {
      const next = map[token];
      if (typeof next !== 'string') continue; // unresolved → stays

      value = value.replaceAll(token, next);
      used.push(token);
      replaced = true;
    }

    if (!replaced) break; // no expansions this round → stop
  }

  return {
    value,
    used,
    remaining: extractTokens(value),
  };
}
