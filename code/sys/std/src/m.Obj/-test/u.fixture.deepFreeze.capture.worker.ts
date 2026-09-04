import { Obj } from '../mod.ts';

const NativeError = Error;
const NativeTypeError = TypeError;
const NativeObject = Object;
const NativeArray = Array;
const NativeNumber = Number;
const NativeSet = Set;
const NativeReflect = Reflect;
const defineProperty = Object.defineProperty;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const isFrozen = Object.isFrozen;

type Result = ReturnType<typeof run>;
type Reply = { ok: true; value: Result } | { ok: false; error: string };
type Replacement = Readonly<{
  target: object;
  key: PropertyKey;
  descriptor: PropertyDescriptor;
  value: unknown;
}>;

self.onmessage = () => {
  let reply: Reply;
  try {
    reply = { ok: true, value: run() };
  } catch (cause) {
    reply = {
      ok: false,
      error: cause instanceof NativeError ? cause.stack ?? cause.message : String(cause),
    };
  }
  self.postMessage(reply);
};

function run() {
  const valid = { nested: { value: Number.NaN }, list: [{ value: 'item' }] };
  let getterCalls = 0;
  const invalidChild = { value: 'mutable' };
  const invalid = { child: invalidChild };
  defineProperty(invalid, 'computed', {
    enumerable: true,
    configurable: true,
    get() {
      getterCalls++;
      return invalidChild;
    },
  });

  let poisonCalls = 0;
  const poison = () => {
    poisonCalls++;
    throw new NativeError('ambient intrinsic poison invoked');
  };
  const PoisonObject = { prototype: {}, freeze: poison };
  const PoisonArray = { isArray: poison, prototype: {} };
  const PoisonNumber = {
    isNaN: poison,
    get NaN() {
      return poison();
    },
  };
  const PoisonReflect = { apply: poison, ownKeys: poison };
  const PoisonSet = function () {
    return poison();
  };
  const PoisonTypeError = function () {
    return poison();
  };

  const replacements: readonly Replacement[] = [
    replacement(NativeObject, 'freeze', poison),
    replacement(NativeObject, 'getPrototypeOf', poison),
    replacement(NativeObject, 'getOwnPropertyDescriptor', poison),
    replacement(NativeObject, 'is', poison),
    replacement(NativeReflect, 'apply', poison),
    replacement(NativeReflect, 'ownKeys', poison),
    replacement(NativeArray, 'isArray', poison),
    replacement(NativeArray.prototype, 'push', poison),
    replacement(NativeArray.prototype, 'pop', poison),
    replacement(NativeArray.prototype, Symbol.iterator, poison),
    replacement(NativeNumber, 'isNaN', poison),
    replacement(NativeSet.prototype, 'has', poison),
    replacement(NativeSet.prototype, 'add', poison),
    replacement(globalThis, 'Object', PoisonObject),
    replacement(globalThis, 'Array', PoisonArray),
    replacement(globalThis, 'Number', PoisonNumber),
    replacement(globalThis, 'Reflect', PoisonReflect),
    replacement(globalThis, 'Set', PoisonSet),
    replacement(globalThis, 'TypeError', PoisonTypeError),
  ];

  let validResult: unknown;
  let failure: unknown;
  try {
    for (let index = 0; index < replacements.length; index++) {
      const item = replacements[index];
      replaceValue(item.target, item.key, item.descriptor, item.value);
    }

    validResult = Obj.deepFreeze(valid);
    try {
      Obj.deepFreeze(invalid);
    } catch (cause) {
      failure = cause;
    }
  } finally {
    for (let index = replacements.length - 1; index >= 0; index--) {
      const item = replacements[index];
      defineProperty(item.target, item.key, item.descriptor);
    }
  }

  let descriptorsRestored = true;
  for (let index = 0; index < replacements.length; index++) {
    const item = replacements[index];
    if (!sameDescriptor(getOwnPropertyDescriptor(item.target, item.key), item.descriptor)) {
      descriptorsRestored = false;
      break;
    }
  }

  return {
    descriptorsRestored,
    poisonCalls,
    validSameIdentity: validResult === valid,
    validRootFrozen: isFrozen(valid),
    validNestedFrozen: isFrozen(valid.nested),
    validArrayFrozen: isFrozen(valid.list),
    validArrayItemFrozen: isFrozen(valid.list[0]),
    invalidNativeTypeError: failure instanceof NativeTypeError,
    invalidMessage: failure instanceof NativeError ? failure.message : undefined,
    getterCalls,
    invalidRootFrozen: isFrozen(invalid),
    invalidChildFrozen: isFrozen(invalidChild),
  };
}

function replacement(target: object, key: PropertyKey, value: unknown): Replacement {
  const descriptor = getOwnPropertyDescriptor(target, key);
  if (!descriptor) throw new NativeError(`Missing intrinsic descriptor: ${String(key)}`);
  return { target, key, descriptor, value };
}

function replaceValue(
  target: object,
  key: PropertyKey,
  descriptor: PropertyDescriptor,
  value: unknown,
): void {
  defineProperty(target, key, {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: true,
    value,
  });
}

function sameDescriptor(
  actual: PropertyDescriptor | undefined,
  expected: PropertyDescriptor,
): boolean {
  return !!actual &&
    actual.configurable === expected.configurable &&
    actual.enumerable === expected.enumerable &&
    actual.get === expected.get &&
    actual.set === expected.set &&
    actual.value === expected.value &&
    actual.writable === expected.writable;
}
