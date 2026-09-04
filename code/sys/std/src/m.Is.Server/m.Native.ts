import { NodeTypes, type t } from './common.ts';

const isNativeError = NodeTypes.isNativeError;
const isPromise = NodeTypes.isPromise;
const isProxy = NodeTypes.isProxy;
const isSharedArrayBuffer = NodeTypes.isSharedArrayBuffer;
const isUint8Array = NodeTypes.isUint8Array;

/**
 * JavaScript identity classifiers backed by host introspection.
 */
export const Native: t.Is.Server.Native.Lib = Object.freeze({
  proxy: isProxy,
  promise: isPromise,
  error: isNativeError,
  uint8Array: isUint8Array,
  sharedArrayBuffer: isSharedArrayBuffer,
});
