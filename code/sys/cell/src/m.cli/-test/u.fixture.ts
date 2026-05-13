/**
 * Shared CLI test fixtures.
 */

/** Suppress command presentation while preserving the returned CLI result. */
export async function silent<T>(fn: () => Promise<T>) {
  const info = console.info;
  console.info = () => undefined;

  try {
    return await fn();
  } finally {
    console.info = info;
  }
}
