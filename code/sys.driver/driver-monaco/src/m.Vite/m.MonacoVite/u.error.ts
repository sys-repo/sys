import { Err } from './common.ts';

export function fail(message: string): never {
  throw Err.std(`Monaco asset contract failed: ${message}`);
}
