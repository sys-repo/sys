import { Is, Str, type t } from './common.ts';
import { errorRecordName, isErrorRecord, metadata, valueSummary } from './u.summary.value.ts';

/**
 * Produce a clean, stable human-readable summary of an unknown error-like value.
 *
 * - `Error` → "Name: message" (+ optional cause and stack).
 * - Error-like records → "Name: message" with bounded diagnostic metadata.
 * - Other objects → constructor/tag plus whitelisted diagnostic metadata only.
 */
export const summary: t.Err.Lib['summary'] = (input, opts) => {
  const options: t.ErrSummaryOptions = opts ?? {};
  const visited = new WeakSet<object>();

  const toSummary = (value: unknown): string => {
    if (Is.error(value)) {
      if (visited.has(value)) return `${value.name}: ${value.message}`;
      visited.add(value);

      const str = Str.builder();
      str.line(`${value.name}: ${value.message}${metadata(value)}`);
      if (options.cause) {
        const cause: unknown = Reflect.get(value, 'cause');
        if (cause !== undefined) str.line(`Cause: ${toSummary(cause)}`);
      }

      if (options.stack && Is.str(value.stack) && value.stack.length > 0) {
        str.line(value.stack);
      }

      return String(str);
    }

    if (isErrorRecord(value)) {
      if (visited.has(value)) return `${errorRecordName(value)}: ${value.message}`;
      visited.add(value);

      const str = Str.builder();
      str.line(`${errorRecordName(value)}: ${value.message}${metadata(value)}`);
      if (options.cause && value.cause !== undefined) str.line(`Cause: ${toSummary(value.cause)}`);
      return String(str);
    }

    return valueSummary(value);
  };

  return toSummary(input);
};
