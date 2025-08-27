import { type t, Err, Is } from './common.ts';

export function fromJson(json: unknown): t.FileMapFromJsonResult {
  if (!Is.record(json)) {
    return err('Invalid FileMap: expected an object { [path: string]: string }.');
  }

  const obj = json as Record<string, unknown>;
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof key !== 'string' || key.length === 0) {
      return err('Invalid FileMap: keys must be non-empty strings.');
    }
    if (typeof value !== 'string') {
      return err(`Invalid FileMap: value for key "${key}" must be a string.`);
    }
    out[key] = value;
  }

  return { fileMap: out as t.FileMap };
}

/**
 * Helpers:
 */
function err(message: string): t.FileMapFromJsonResult {
  return { error: Err.std(message) };
}
