import { NodeTypes, type t } from './common.ts';

/**
 * JavaScript identity classifiers backed by host introspection.
 */
export const Native: t.Is.Server.Native.Lib = Object.freeze({
  proxy: NodeTypes.isProxy,
  promise: NodeTypes.isPromise,
  error: NodeTypes.isNativeError,
  uint8Array: NodeTypes.isUint8Array,
  sharedArrayBuffer: NodeTypes.isSharedArrayBuffer,
});
