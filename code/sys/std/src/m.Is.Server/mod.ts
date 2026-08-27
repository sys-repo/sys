/**
 * @module
 * Native-identity predicates for Deno and Node.
 *
 * The `server` subpath marks a runtime boundary, not network authority. It uses
 * `node:util.types` to classify values without reading their properties or
 * invoking Proxy traps; browsers provide no equivalent Proxy detector.
 *
 * The host classifier bindings must retain their host-provided identities when
 * this module evaluates. The frozen surface keeps those captured references and
 * ignores later property replacement. A match proves identity only within that
 * initialization precondition; it does not establish ownership or make later
 * operations safe.
 */
import { BaseIs, type t } from './common.ts';
import { Native } from './m.Native.ts';

/**
 * The universal `Is` surface with Deno and Node native-identity predicates.
 */
export const Is: t.Is.Server.Lib = Object.freeze({
  ...BaseIs,
  Native,
  proxy: Native.proxy,
  nativePromise: Native.promise,
  nativeError: Native.error,
  nativeUint8Array: Native.uint8Array,
  nativeSharedArrayBuffer: Native.sharedArrayBuffer,
});
