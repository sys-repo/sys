import { Is, StartGuiIntrinsic } from './common.ts';

const OWNED_ERRORS = StartGuiIntrinsic.createWeakSet<object>();
const NativeError = Error;

/** Create one native Error authenticated as package-owned evidence. */
export function createOwnedError(message: string): Error {
  return markOwnedError(new NativeError(message));
}

/** Authenticate an error only after a private package or lower-owner classifier accepted it. */
export function markOwnedError<T extends Error>(error: T): T {
  StartGuiIntrinsic.weakSetAdd(OWNED_ERRORS, error);
  return error;
}

/** Convert arbitrary rejection evidence without inspecting or retaining caller-owned values. */
export function ownedError(input: unknown, fallback: string): Error {
  return isOwnedError(input) ? input : createOwnedError(fallback);
}

function isOwnedError(input: unknown): input is Error {
  return Is.object(input) && StartGuiIntrinsic.weakSetHas(OWNED_ERRORS, input);
}
