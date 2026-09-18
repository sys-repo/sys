import { Is, Num, Obj, type t } from './common.ts';

type Budget = { nodes: number };

const NativeArray = Array;
const NativeTypeError = TypeError;
const REFUSED = Symbol('Dispose.Snapshot.until:refused');
const { freeze, getPrototypeOf, getOwnPropertyDescriptor, getOwnPropertyDescriptors } = Object;
const ownKeys = Reflect.ownKeys;
const MAX_NODES = 256;
const MAX_DEPTH = 32;

/** Capture cancellation containers without acquiring subscriptions or disposal authority. */
export const until: t.Dispose.Snapshot.Lib['until'] = (input) => {
  if (input === undefined) return undefined;
  try {
    return capture(input, new WeakSet<object>(), { nodes: 0 }, 0);
  } catch (cause) {
    // The private refusal identity never escapes. Caller exceptions remain opaque, including
    // `throw undefined` and TypeErrors from an earlier capture; only owners interpret them.
    throw cause === REFUSED
      ? new NativeTypeError('Invalid UntilInput')
      : new NativeTypeError('Invalid UntilInput', { cause });
  }
};

function capture(
  input: unknown,
  seen: WeakSet<object>,
  budget: Budget,
  arrayDepth: number,
): t.Dispose.Snapshot.Until {
  if (++budget.nodes > MAX_NODES) throw REFUSED;
  if (input === undefined) return undefined;
  if (!Is.object(input) || Is.Native.proxy(input)) throw REFUSED;
  if (!Is.array(input)) {
    let prototype = getPrototypeOf(input);
    while (prototype) {
      if (Is.Native.proxy(prototype)) throw REFUSED;
      prototype = getPrototypeOf(prototype);
    }
    if (!Is.untilInput(input)) throw REFUSED;
    return input;
  }

  if (
    arrayDepth >= MAX_DEPTH ||
    getPrototypeOf(input) !== NativeArray.prototype ||
    seen.has(input)
  ) throw REFUSED;
  seen.add(input);

  // Refuse oversized work before collecting keys/descriptors, even for enormous sparse arrays.
  const lengthDescriptor = getOwnPropertyDescriptor(input, 'length');
  if (!lengthDescriptor || !Obj.hasOwn(lengthDescriptor, 'value')) throw REFUSED;
  const length = lengthDescriptor.value;
  if (!Num.Is.safeInt(length) || length < 0 || length > MAX_NODES - budget.nodes) {
    throw REFUSED;
  }

  const descriptors = getOwnPropertyDescriptors(input);
  const keys = ownKeys(input);
  if (keys.length !== length + 1) throw REFUSED;
  const snapshot: t.Dispose.Snapshot.Until[] = [];
  for (let index = 0; index < length; index++) {
    const key = String(index);
    const descriptor = descriptors[key];
    if (
      !Obj.hasOwn(descriptors, key) || !descriptor ||
      !('value' in descriptor) || descriptor.enumerable !== true
    ) {
      throw REFUSED;
    }
    snapshot.push(capture(descriptor.value, seen, budget, arrayDepth + 1));
  }
  if (keys.some((key) => key !== 'length' && !/^\d+$/u.test(String(key)))) throw REFUSED;
  return freeze(snapshot);
}
