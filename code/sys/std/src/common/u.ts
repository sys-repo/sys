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
export function isRecord(input: any): input is O {
  return isObject(input) && !Array.isArray(input);
}

/**
 * Determine if the given object is empty of all fields.
 */
export function isEmptyRecord(input: any): input is object {
  return isRecord(input) && Object.keys(input).length === 0;
}
