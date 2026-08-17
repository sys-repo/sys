/**
 * @module
 * Native-identity predicates for Deno and Node.
 *
 * The `server` subpath marks a runtime boundary, not network authority. It uses
 * `node:util.types` to classify values without reading their properties or
 * invoking Proxy traps; browsers provide no equivalent Proxy detector.
 *
 * A match proves identity only. It does not establish ownership or make later
 * operations safe.
 */
import { BaseIs, NodeTypes, type t } from './common.ts';

/**
 * The universal `Is` surface with Deno and Node native-identity predicates.
 */
export const Is: t.Is.Server.Lib = Object.freeze({
  ...BaseIs,
  proxy: NodeTypes.isProxy,
  nativePromise: NodeTypes.isPromise,
  nativeError: NodeTypes.isNativeError,
  nativeUint8Array: NodeTypes.isUint8Array,
  nativeSharedArrayBuffer: NodeTypes.isSharedArrayBuffer,
});
