import { Is, StartGuiIntrinsic } from './common.ts';
import { createOwnedError } from './u.error.ts';

type NativeSignalPropertyShape = Readonly<{
  key: PropertyKey;
  configurable: boolean;
  enumerable: boolean;
  writable: boolean;
}>;

const NativeAbortController = AbortController;
const apply = Reflect.apply;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const ownKeys = Reflect.ownKeys;
const controllerSignal = getOwnPropertyDescriptor(
  NativeAbortController.prototype,
  'signal',
)?.get;
const signalPrototype = AbortSignal.prototype;
const signalAbortedDescriptor = snapshotDescriptor(signalPrototype, 'aborted');
const signalReasonDescriptor = snapshotDescriptor(signalPrototype, 'reason');
const signalAborted = signalAbortedDescriptor?.get;
const eventTargetPrototype = EventTarget.prototype;
const addEventListenerDescriptor = snapshotDescriptor(eventTargetPrototype, 'addEventListener');
const removeEventListenerDescriptor = snapshotDescriptor(
  eventTargetPrototype,
  'removeEventListener',
);
const addEventListener = addEventListenerDescriptor?.value;
const nativeSignalShape = snapshotNativeSignalShape();

/** Admit only one direct native signal without invoking structural accessors or Proxy traps. */
export function snapshotCapturedAbortSignal(input: unknown): AbortSignal | undefined {
  if (!Is.object(input) || Is.proxy(input) || !abortSubstrateReady()) return;
  try {
    if (getPrototypeOf(input) !== signalPrototype || !sameNativeSignalShape(input)) return;
    const value = signalAborted ? apply(signalAborted, input, []) : undefined;
    return Is.bool(value) ? input as AbortSignal : undefined;
  } catch {
    return;
  }
}

/** Read one package-owned native signal without later AbortSignal prototype lookup. */
export function isCapturedSignalAborted(signal: AbortSignal): boolean {
  if (!signalAborted) throw cancellationAuthorityError();
  try {
    const value = apply(signalAborted, signal, []);
    if (!Is.bool(value)) throw cancellationAuthorityError();
    return value;
  } catch {
    throw cancellationAuthorityError();
  }
}

/** Attach one package-owned native signal through captured EventTarget authority. */
export function observeCapturedAbort(signal: AbortSignal, listener: () => void): void {
  if (!addEventListener) throw cancellationAuthorityError();
  try {
    apply(addEventListener, signal, ['abort', listener, { once: true }]);
  } catch {
    throw cancellationAuthorityError();
  }
}

function snapshotNativeSignalShape(): readonly NativeSignalPropertyShape[] | undefined {
  if (!controllerSignal) return;
  try {
    const controller = new NativeAbortController();
    const signal = apply(controllerSignal, controller, []);
    if (!Is.object(signal) || getPrototypeOf(signal) !== signalPrototype) return;
    const keys = ownKeys(signal);
    const result: NativeSignalPropertyShape[] = [];
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const descriptor = getOwnPropertyDescriptor(signal, key);
      if (!descriptor || !('value' in descriptor)) return;
      StartGuiIntrinsic.arrayPush(
        result,
        freeze({
          key,
          configurable: descriptor.configurable === true,
          enumerable: descriptor.enumerable === true,
          writable: descriptor.writable === true,
        }),
      );
    }
    return freeze(result);
  } catch {
    return;
  }
}

function sameNativeSignalShape(input: object): boolean {
  if (!nativeSignalShape) return false;
  const keys = ownKeys(input);
  if (keys.length !== nativeSignalShape.length) return false;
  for (let index = 0; index < nativeSignalShape.length; index += 1) {
    const expected = nativeSignalShape[index];
    if (!StartGuiIntrinsic.arrayIncludes(keys, expected.key)) return false;
    const descriptor = getOwnPropertyDescriptor(input, expected.key);
    if (
      !descriptor || !('value' in descriptor) ||
      descriptor.configurable !== expected.configurable ||
      descriptor.enumerable !== expected.enumerable ||
      descriptor.writable !== expected.writable
    ) return false;
  }
  return true;
}

function abortSubstrateReady(): boolean {
  try {
    return sameDescriptor(signalPrototype, 'aborted', signalAbortedDescriptor) &&
      sameDescriptor(signalPrototype, 'reason', signalReasonDescriptor) &&
      sameDescriptor(eventTargetPrototype, 'addEventListener', addEventListenerDescriptor) &&
      sameDescriptor(
        eventTargetPrototype,
        'removeEventListener',
        removeEventListenerDescriptor,
      );
  } catch {
    return false;
  }
}

function snapshotDescriptor(
  input: object,
  key: PropertyKey,
): Readonly<PropertyDescriptor> | undefined {
  const descriptor = getOwnPropertyDescriptor(input, key);
  if (!descriptor) return;
  return freeze({
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    ...('value' in descriptor
      ? { value: descriptor.value, writable: descriptor.writable }
      : { get: descriptor.get, set: descriptor.set }),
  });
}

function sameDescriptor(
  input: object,
  key: PropertyKey,
  expected: Readonly<PropertyDescriptor> | undefined,
): boolean {
  if (!expected) return false;
  const actual = getOwnPropertyDescriptor(input, key);
  if (
    !actual || actual.configurable !== expected.configurable ||
    actual.enumerable !== expected.enumerable
  ) return false;
  return 'value' in expected
    ? 'value' in actual && actual.value === expected.value && actual.writable === expected.writable
    : !('value' in actual) && actual.get === expected.get && actual.set === expected.set;
}

function cancellationAuthorityError(): Error {
  return createOwnedError('start:gui cancellation authority unavailable.');
}
