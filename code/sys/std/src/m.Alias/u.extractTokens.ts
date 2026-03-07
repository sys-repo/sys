import { type t } from './common.ts';

/**
 * Returns the unique alias tokens (e.g. ":core", ":p2p-assets") found in the input string.
 *
 * Rules:
 * - Token must start with ":".
 * - The ":" must NOT be immediately preceded by an alphanumeric character
 *   (so "crdt:123" does not produce ":123").
 * - Token continues while characters are in [A-Za-z0-9._-].
 * - Order is deterministic in left-to-right appearance.
 */
export function extractTokens(input: string): t.Alias.Key[] {
  const tokens: t.Alias.Key[] = [];
  const seen = new Set<string>();
  const len = input.length;

  for (let i = 0; i < len; i++) {
    if (input[i] !== ':') continue;

    const prev = i > 0 ? input[i - 1] : '';
    // Ignore things like "crdt:123" where ":" is part of another word.
    if (prev && /[A-Za-z0-9]/.test(prev)) continue;

    let j = i + 1;
    while (j < len && /[A-Za-z0-9._-]/.test(input[j])) j++;

    const token = input.slice(i, j);
    if (token.length <= 1) continue; // ":" only → ignore

    if (!seen.has(token)) {
      seen.add(token);
      tokens.push(token as t.Alias.Key);
    }
  }

  return tokens;
}
