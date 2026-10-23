import { type t, Obj } from './common.ts';

/**
 * Convert a command → aliases map into an alias → command lookup.
 *
 * This is a pure transform used to normalize argv where the first positional
 * may be an alias (e.g. "cp" → "copy").
 */
export function toAliasLookup<T extends Record<string, t.Args.Alias.List>>(
  map: T,
): Record<string, Extract<keyof T, string>> {
  const lookup: Record<string, Extract<keyof T, string>> = {};

  for (const [command, aliases] of Obj.entries(map)) {
    const key = command as Extract<keyof T, string>;
    for (const alias of aliases) lookup[alias] = key;
  }

  return lookup;
}
