/**
 * Typed variant of native `Object.entries` that preserves key/value relationships.
 *
 * NOTE:
 * This is a *type assertion* (the platform typing loses key/value correlation).
 * Use for static/known-shape objects (e.g. `as const` registries, config maps),
 * not for untrusted or mutation-heavy dictionaries.
 */
export function entries<T extends Record<string, unknown>>(
  obj: T,
): readonly (readonly [keyof T, T[keyof T]])[] {
  type Entry = readonly [keyof T, T[keyof T]];
  type Entries = readonly Entry[];
  return Object.entries(obj) as unknown as Entries;
}
