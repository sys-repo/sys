import { Is } from '../common.ts';
import { fail } from '../u/u.error.ts';

/** Validate that a Files command payload is an object before field access. */
export function assertPayload(input: unknown, command: string): asserts input is object {
  if (!Is.plainObject(input)) {
    throw fail('FilesMemoryError.InvalidPath', `Files ${command} payload must be a plain object`);
  }
}
