import { Is, type t } from './common.ts';

const errors = new WeakSet<object>();
const NativeAddrInUse = Deno.errors.AddrInUse;
const NativeError = Error;
const defineProperties = Object.defineProperties;
const freeze = Object.freeze;

/** Public DistServer startup-error classifier. */
export const DistServerError: t.DistServer.Error.Lib = freeze({
  is(value): value is t.DistServer.StartError {
    return typeof value === 'object' && value !== null && errors.has(value);
  },
});

/** Create one frozen startup failure without embedded input or cause details. */
export function startError(reason: t.DistServer.StartFailureReason): t.DistServer.StartError {
  const error = new NativeError(message(reason)) as t.DistServer.StartError;
  defineProperties(error, {
    name: { value: 'DistServer.StartError', enumerable: false },
    reason: { value: reason, enumerable: true },
  });
  errors.add(error);
  return freeze(error);
}

/** Classify a listener-start failure without retaining its cause. */
export function startupReason(cause: unknown): t.DistServer.StartFailureReason {
  return Is.Native.error(cause) && cause instanceof NativeAddrInUse
    ? 'address-in-use'
    : 'startup-failure';
}

function message(reason: t.DistServer.StartFailureReason): string {
  switch (reason) {
    case 'invalid-input':
      return 'DistServer.start: invalid input.';
    case 'invalid-hostname':
      return 'DistServer.start: hostname must be loopback.';
    case 'missing':
      return 'DistServer.start: pinned generation is unavailable.';
    case 'cancelled':
      return 'DistServer.start: startup cancelled.';
    case 'address-in-use':
      return 'DistServer.start: address is unavailable.';
    case 'startup-failure':
      return 'DistServer.start: startup failed.';
    default:
      return 'DistServer.start: pinned generation verification failed.';
  }
}
