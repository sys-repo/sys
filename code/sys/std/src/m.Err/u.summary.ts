import { type t, Str } from './common.ts';

/**
 * Produce a clean, stable human-readable summary of an unknown error-like value.
 *
 * - `Error` → "Name: message" (+ optional cause and stack).
 * - All other values → `String(input)`.
 */
export const summary: t.ErrLib['summary'] = (input, opts) => {
  const options: t.ErrSummaryOptions = opts ?? {};
  const visited = new WeakSet<Error>();

  const toSummary = (value: unknown): string => {
    if (value instanceof Error) {
      if (visited.has(value)) {
        return `${value.name}: ${value.message}`; // Avoid infinite recursion on cyclic causes.
      }
      visited.add(value);

      const str = Str.builder();
      str.line(`${value.name}: ${value.message}`);
      if (options.cause) {
        const cause = (value as Error & { cause?: unknown }).cause;
        if (cause !== undefined) str.line(`Cause: ${toSummary(cause)}`);
      }

      if (options.stack && typeof value.stack === 'string' && value.stack.length > 0) {
        str.line(value.stack);
      }

      return String(str);
    }
    return String(value);
  };

  return toSummary(input);
};
