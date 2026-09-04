import { isRecord } from '../common.ts';

/**
 * Typed variant of the native [Object.keys].
 */
export function keys<T extends object>(obj?: T): Array<keyof T> {
  return isRecord(obj) ? (Object.keys(obj) as Array<keyof T>) : [];
}
