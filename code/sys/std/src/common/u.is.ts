type O = Record<string, unknown>;

/**
 * True if input is a non-null object (includes arrays, functions, etc.).
 */
export function isObject(input: unknown): input is object {
  return typeof input === 'object' && input !== null;
}

/**
 * True if input is a simple {key:value} record (non-null, non-array).
 */
export function isRecord<T extends Record<string, unknown>>(input: unknown): input is T {
  return isObject(input) && !Array.isArray(input);
}

/**
 * True if input is a record and contains no own enumerable keys.
 */
export function isEmptyRecord<T extends Record<string, unknown>>(input: unknown): input is T {
  return isRecord(input) && Object.keys(input).length === 0;
}

/**
 * True if input is a plain object literal (prototype === Object.prototype or null).
 * - Excludes arrays, functions, class instances, Date, Map, Set, etc.
 * - Cross-realm safe via Object.prototype.toString.
 */
export const isPlainObject = (input: unknown): input is Record<PropertyKey, unknown> => {
  if (!isRecord(input)) return false;
  const tag = Object.prototype.toString.call(input);
  if (tag !== '[object Object]') return false; // cross-realm guard
  const proto = Object.getPrototypeOf(input);
  return proto === Object.prototype || proto === null;
};

/**
 * True if input is a "plain record" (null-prototype dictionary only).
 * - Accepts Object.create(null).
 * - Excludes arrays, prototypes, and class instances.
 */
export const isPlainRecord = (input: unknown): input is Record<PropertyKey, unknown> => {
  if (!isRecord(input)) return false;
  const tag = Object.prototype.toString.call(input);
  if (tag !== '[object Object]') return false; // cross-realm guard
  return Object.getPrototypeOf(input) === null;
};
