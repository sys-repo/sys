type O = Record<string, unknown>;

/**
 * Toggle the value of a boolean {object} key.
 * WARNING:
 *    This manipulates the given object.
 *    Ensure an immutable-safe object is passed.
 */
export function toggle<T extends O | any[]>(
  mutate: T,
  key: T extends any[] ? number : keyof T,
  defaultValue = true,
): boolean {
  if (mutate === null || typeof mutate !== 'object') {
    throw new Error(`Object or Array required.`);
  }

  const current = (mutate as any)[key];
  if (typeof current !== 'boolean' && current !== undefined) {
    const displayKey = typeof key === 'string' ? `"${key}"` : `[${key}]`;
    throw new Error(`Value at key ${displayKey} is not a boolean.`);
  }

  const next = current === undefined ? defaultValue : !current;
  (mutate as any)[key] = next as T extends any[] ? T[number] : T[keyof T];
  return next;
}
