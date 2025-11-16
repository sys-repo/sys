import { type t } from './common.ts';
import { Is } from './m.Is.ts';

export const normalize: t.ErrLib['normalize'] = (input) => {
  // Preserve native Error instances as-is.
  if (input instanceof Error) return input;

  // Preserve structured "error-like" objects by lifting them into a real Error,
  // while copying fields across (kind, name, code, etc).
  if (Is.errorLike(input)) {
    const src = input as { [key: string]: unknown; message: string; name?: unknown };

    const { message, name, ...rest } = src;
    const error = new Error(message);

    // Preserve an explicit name if present (e.g. "CrdtRepoError").
    if (typeof name === 'string') {
      error.name = name;
    }

    // Copy all remaining enumerable fields onto the Error instance for downstream access.
    Object.assign(error, rest);
    return error;
  }

  // Fallback: stringify anything else (numbers, booleans, null, etc).
  return new Error(String(input));
};
