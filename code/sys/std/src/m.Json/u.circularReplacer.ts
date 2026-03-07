/**
 * Creates a JSON.stringify replacer that marks circular references with a tag.
 *
 * Example:
 *   const text = JSON.stringify(value, Json.circularReplacer()); // "[Circular]" by default
 *
 * Note:
 *   The @sys/std Json.stringify implementation already uses this internally,
 *   so it is safe by default for circular structures.
 */
export function circularReplacer(tag: string = '[Circular]') {
  const seen = new WeakSet<object>();
  return function (_key: string, value: unknown) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value as object)) return tag;
      seen.add(value as object);
    }
    return value;
  };
}
