import { Err } from './common.ts';

export function fail(message: string): Error {
  return Err.std(message, { name: 'FilesCursorError' });
}
