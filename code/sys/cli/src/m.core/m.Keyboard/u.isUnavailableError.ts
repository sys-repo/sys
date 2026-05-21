import { Is } from '../common.ts';

export function isUnavailableError(error: unknown): boolean {
  if (!Is.error(error)) return false;
  if (error.name === 'BadResource') return true;
  return /ENODEV|ENOTTY|No such device|Not a typewriter/i.test(error.message);
}
