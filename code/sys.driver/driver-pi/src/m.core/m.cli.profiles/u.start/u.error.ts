import { Is } from './common.ts';

const OWNED_ERRORS = new WeakSet<object>();

/** Create one native Error authenticated as package-owned evidence. */
export function createOwnedError(message: string): Error {
  return markOwnedError(new Error(message));
}

/** Authenticate an error only after a package or lower-owner classifier accepted it. */
export function markOwnedError<T extends Error>(error: T): T {
  OWNED_ERRORS.add(error);
  return error;
}

/** Convert arbitrary rejection evidence without inspecting or retaining caller-owned values. */
export function ownedError(input: unknown, fallback: string): Error {
  return isOwnedError(input) ? input : createOwnedError(fallback);
}

function isOwnedError(input: unknown): input is Error {
  return Is.object(input) && OWNED_ERRORS.has(input);
}
