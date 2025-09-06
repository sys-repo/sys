import { type t, Err, Is } from './common.ts';

export function validate(input: unknown): t.FileMapValidateResult {
  let json: unknown = input;

  if (Is.string(input)) {
    try {
      json = JSON.parse(input);
    } catch (cause) {
      return { error: Err.std('Invalid FileMap: JSON parse failed', { cause }) };
    }
  }

  if (!Is.record(json)) {
    return { error: Err.std('Invalid FileMap: expected an object { [path: string]: string }.') };
  }

  const obj = json as Record<string, unknown>;
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!Is.string(key) || key.length === 0) {
      return { error: Err.std('Invalid FileMap: keys must be non-empty strings.') };
    }
    if (!Is.string(value)) {
      return { error: Err.std(`Invalid FileMap: value for key "${key}" must be a string.`) };
    }
    out[key] = value;
  }

  return { fileMap: out as t.FileMap };
}
