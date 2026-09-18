type O = Record<string, unknown>;

/**
 * Retrieve a new object containing only the given set of keys.
 */
export function pick<T extends O>(subject: T, ...fields: (keyof T)[]): T {
  return fields.reduce((acc, next) => {
    acc[next] = subject[next];
    return acc;
  }, {} as T);
}
