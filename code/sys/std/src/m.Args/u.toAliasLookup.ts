import { type t, Obj } from './common.ts';

/**
 * Convert a command → aliases map into an alias → command lookup.
 *
 * This is a pure transform used to normalize argv where the first positional
 * may be an alias (e.g. "cp" → "copy").
 */
export function toAliasLookup<T extends Record<string, t.ArgsAliasList>>(
  map: T,
): Record<string, keyof T> {
  const lookup: Record<string, keyof T> = {};

  for (const [command, aliases] of Obj.entries(map)) {
    for (const alias of aliases) lookup[alias] = command;
  }

  return lookup;
}
