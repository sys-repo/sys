import { Is, Num, type t } from '../common.ts';
import { fail } from './u.error.ts';

/** Validate an optional string-valued memory node field. */
export function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (Is.string(value)) return value;
  throw fail('FilesMemoryError.InvalidPath', `Memory file ${name} must be a string`);
}

/** Validate an optional timestamp-valued memory node field. */
export function optionalTimestamp(value: unknown, name: string): t.UnixTimestamp | undefined {
  if (value === undefined) return undefined;
  if (Num.Is.finite(value)) return value as t.UnixTimestamp;
  throw fail('FilesMemoryError.InvalidPath', `Memory file ${name} must be a finite number`);
}
