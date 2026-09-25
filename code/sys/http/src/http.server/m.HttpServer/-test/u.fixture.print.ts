/** Capture synchronous `console.info` output; always restore the original sink. */
export function capturePrint<T>(
  fn: () => T,
): { readonly value: T; readonly output: readonly string[] } {
  const output: string[] = [];
  const original = console.info;
  console.info = (...args: unknown[]) => output.push(args.map(String).join(' '));
  try {
    return { value: fn(), output };
  } finally {
    console.info = original;
  }
}
