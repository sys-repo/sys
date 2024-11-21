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
  return isObject(input);
}
