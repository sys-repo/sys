export async function quietly<T>(fn: () => Promise<T>): Promise<T> {
  const info = console.info;
  const warn = console.warn;

  console.info = () => {};
  console.warn = () => {};
  try {
    return await fn();
  } finally {
    console.info = info;
    console.warn = warn;
  }
}
