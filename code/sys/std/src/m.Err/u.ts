type O = Record<string, unknown>;

export function isObject(input: unknown): input is O {
  return input !== null && typeof input === 'object';
}
