import { Is, Num, Obj, Pkg, ServerIs, type t } from './common.ts';
import { toPresignKey } from '../m.Service/u.presign.ts';
import type { DistInput } from './t.internal.ts';
import { isRoutePath, snapshotLimits, snapshotSource } from './u.input.ts';

const NativePromise = Promise;
const promisePrototype = NativePromise.prototype;
const promiseThen = promisePrototype.then;
const speciesGetter = Object.getOwnPropertyDescriptor(NativePromise, Symbol.species)?.get;

/** Validate and copy inputs before signing or invoking the route policy. */
export function snapshotDist(input: t.R2.ReadRoute.FromDist.Args): DistInput {
  const source = snapshotSource(input);
  if (!Is.str(source.storageOrigin)) throw invalid();
  const prefix = input.prefix;
  if (!Is.str(prefix)) throw invalid();
  if (prefix !== '') toPresignKey(prefix);
  objectKey(prefix, 'dist.json');
  const pin = input.pin;
  if (!Pkg.Is.distPin(pin)) throw invalid();
  const integrity = pin['dist.json'];
  const { manifestBytes, entries, fileBytes, totalBytes } = input.manifestLimits ?? {};
  if (
    ![manifestBytes, entries].every((n) => Num.Is.safeInt(n) && n > 0) ||
    ![fileBytes, totalBytes].every((n) => Num.Is.safeInt(n) && n >= 0)
  ) throw invalid();
  const manifestLimits = Object.freeze({ manifestBytes, entries, fileBytes, totalBytes });
  const limits = snapshotLimits(input.limits);
  const authorize = input.authorize;
  const routes = input.routes;
  if (!Is.func(authorize) || !Is.func(routes)) throw invalid();
  const caller = input.signal;
  if (ServerIs.Native.proxy(caller)) throw invalid();
  // Native composition validates the signal and keeps caller-owned listener methods out of cleanup.
  const signal = caller === undefined ? undefined : AbortSignal.any([caller]);
  return Object.freeze({
    source,
    prefix,
    integrity,
    manifestLimits,
    limits,
    authorize,
    routes,
    signal,
  });
}

/** Copy a data-only route map restricted to `dist.hash.parts` entries and `dist.json`. */
export function snapshotDistRoutes(
  input: unknown,
  prefix: string,
  dist: t.DeepReadonly<t.DistPkg>,
): ReadonlyMap<string, string> {
  if (ServerIs.Native.promise(input)) {
    observeOrdinaryPromise(input);
    throw invalid();
  }
  if (ServerIs.Native.proxy(input) || !Is.record(input) || Is.array(input)) throw invalid();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) throw invalid();
  const routes = new Map<string, string>();
  for (const path of Reflect.ownKeys(input)) {
    if (!Is.str(path) || !isRoutePath(path)) throw invalid();
    const field = Object.getOwnPropertyDescriptor(input, path)!;
    if (!Obj.hasOwn(field, 'value')) throw invalid();
    const filename = field.value;
    if (
      !Is.str(filename) ||
      (filename !== 'dist.json' && !Obj.hasOwn(dist.hash.parts, filename))
    ) throw invalid();
    routes.set(path, objectKey(prefix, filename));
  }
  return routes;
}

/** Join prefix and filename without normalization, then validate the full object key. */
export function objectKey(prefix: string, filename: string): string {
  return toPresignKey(prefix === '' ? filename : `${prefix}/${filename}`);
}

/** Observe ordinary Promise rejections without invoking caller-defined getters. */
function observeOrdinaryPromise(input: Promise<unknown>): void {
  if (Object.getPrototypeOf(input) !== promisePrototype || Reflect.ownKeys(input).length !== 0) {
    return;
  }
  const constructor = Object.getOwnPropertyDescriptor(promisePrototype, 'constructor');
  const species = Object.getOwnPropertyDescriptor(NativePromise, Symbol.species);
  if (constructor?.value !== NativePromise || !speciesGetter || species?.get !== speciesGetter) {
    return;
  }

  // Even native `then` reads constructor/species; the checks above keep that access native.
  // For other Promise shapes, the route callback must handle rejections.
  void promiseThen.call(input, () => undefined, () => undefined);
}

function invalid(): Error {
  return new Error('Invalid R2 manifest route input.');
}
