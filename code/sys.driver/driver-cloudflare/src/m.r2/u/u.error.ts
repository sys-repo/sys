import { Is } from './common.ts';

/** True when an upstream object-storage error means the object was not found. */
export function isNotFound(error: unknown): boolean {
  if (Is.httpStatus(error, 404)) return true;
  if (!Is.record<{ readonly statusCode?: unknown; readonly code?: unknown }>(error)) return false;
  return error.statusCode === 404 || error.code === 'NoSuchKey' || error.code === 'NotFound';
}
