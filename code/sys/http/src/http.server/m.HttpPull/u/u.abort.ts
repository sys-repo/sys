import { Is } from '../common.ts';

/**
 * Recognize transport cancellation markers without trusting arbitrary thrown values.
 * This is propagation evidence only; the operation's private signal is the authority for public 499.
 */
export function isAbortError(input: unknown): boolean {
  try {
    if (!Is.record(input)) return false;
    return input.name === 'AbortError' ||
      input.code === 'ABORT_ERR' ||
      input.message === 'disposed';
  } catch {
    return false;
  }
}
