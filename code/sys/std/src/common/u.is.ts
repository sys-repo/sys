type O = Record<string, unknown>;

/**
 * Determine if the given input is typeof {object} and not Null.
 */
export function isObject(input: any): input is object {
  return typeof input === 'object' && input !== null;
}

/**
 * Determine if the given input is a simple {key:value} record object.
 */
export function isRecord<T extends O>(input: any): input is T {
  return isObject(input) && !Array.isArray(input);
}

/**
 * Determine if the given object is empty of all fields.
 */
export function isEmptyRecord<T extends O>(input: any): input is T {
  return isRecord(input) && Object.keys(input).length === 0;
}

/**
 * Test whether a value is a *plain* object literal (strict).
 * - Excludes arrays, functions, class instances, Dates, etc.
 * - Prototype must be exactly Object.prototype.
 */
export const isPlainObject = (input?: unknown): input is Record<PropertyKey, unknown> => {
  if (input === null || typeof input !== 'object') return false;
  if (Array.isArray(input)) return false;
  if (Object.prototype.toString.call(input) !== '[object Object]') return false; // cross-realm
  const proto = Object.getPrototypeOf(input);
  return proto === Object.prototype || proto === null; // ← allow null-proto
};

/**
 * Test whether a value is a *plain record* (object-literal or null-prototype).
 * - Accepts Object.create(null) for dictionary/record use-cases.
 * - Same exclusions as above otherwise.
 */
export const isPlainRecord = (input?: unknown): input is Record<PropertyKey, unknown> => {
  if (input === null || typeof input !== 'object') return false;
  if (Array.isArray(input)) return false;
  if (Object.prototype.toString.call(input) !== '[object Object]') return false; // cross-realm
  return Object.getPrototypeOf(input) === null; // ← **only** null-proto
};
