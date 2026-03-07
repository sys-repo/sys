/**
 * Normalize `argv` by rewriting the first positional token via an alias lookup.
 *
 * If `argv[0]` matches a key in `lookup`, it is replaced with its canonical command.
 * Otherwise argv is returned unchanged (as a new array).
 */
export function normalizeCommand<TCmd extends string>(
  argv: readonly string[],
  lookup: Partial<Record<string, TCmd>>,
): string[] {
  if (!argv.length) return [...argv];

  const [head, ...rest] = argv;
  const canonical = lookup[head];
  if (!canonical) return [...argv];

  return [canonical, ...rest];
}
