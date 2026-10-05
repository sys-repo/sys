import { Is } from '../common.ts';

const START_ERRORS = new WeakSet<Error>();
const NativeError = Error;
const LIFECYCLE_ERROR_MESSAGE = 'BootstrapStatus listener lifecycle failed.';

/** Create one fixed listener-lifecycle failure without exposing a lower cause. */
export function lifecycleError(): Error {
  return new NativeError(LIFECYCLE_ERROR_MESSAGE);
}

/** Create one fixed startup failure and retain its private provenance. */
export function startError(reason: 'invalid input' | 'failed'): Error {
  const message = reason === 'failed'
    ? 'BootstrapStatus.start failed.'
    : 'BootstrapStatus.start invalid input.';
  const error = new NativeError(message);
  START_ERRORS.add(error);
  return error;
}

/** Whether an error was created by the bootstrap-status startup boundary. */
export function isStartError(input: unknown): input is Error {
  return Is.error(input) && START_ERRORS.has(input);
}
