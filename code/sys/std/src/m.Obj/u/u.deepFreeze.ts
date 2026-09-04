import { Is, type t } from '../common.ts';

const CONTRACT_ERROR =
  'Obj.deepFreeze expected primitive leaves in a data-property graph of plain objects and arrays.';

const NativeSet = Set;
const NativeTypeError = TypeError;
const ObjectPrototype = Object.prototype;
const freeze = Object.freeze;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const objectIs = Object.is;
const apply = Reflect.apply;
const ownKeys = Reflect.ownKeys;
const setAdd = Set.prototype.add;
const setHas = Set.prototype.has;
const NaNValue = Number.NaN;
const isArray = Is.array;
const isBool = Is.bool;
const isNil = Is.nil;
const isNumber = Is.num;
const isObject = Is.object;
const isString = Is.str;
const isSymbol = Is.symbol;

type Link<T> = Readonly<{
  value: T;
  next: Link<T> | undefined;
}>;

/**
 * Deeply freeze a trusted, caller-owned plain-data graph without recursive stack growth.
 *
 * Validation completes before any mutable node is frozen. Every own string-keyed data property is
 * traversed, including non-enumerable properties. Runtime authority is captured when this module
 * evaluates. Proxies, deliberately forged prototype chains, and realms compromised before module
 * evaluation are outside this primitive's trust boundary.
 */
export const deepFreeze: t.Obj.Lib['deepFreeze'] = (input) => {
  let pending: Link<unknown> | undefined = { value: input, next: undefined };
  const seen = new NativeSet<object>();
  let nodes: Link<object> | undefined;

  while (pending) {
    const current = pending.value;
    pending = pending.next;

    if (!isObject(current)) {
      const primitive = isNil(current) ||
        isString(current) ||
        isBool(current) ||
        isNumber(current) ||
        objectIs(current, NaNValue);
      if (!primitive) invalidGraph();
      continue;
    }

    if (apply(setHas, seen, [current])) continue;

    const prototype = getPrototypeOf(current);
    const supportedNode = isArray(current)
      ? isArray(prototype)
      : prototype === ObjectPrototype || prototype === null;
    if (!supportedNode) invalidGraph();

    apply(setAdd, seen, [current]);
    nodes = { value: current, next: nodes };

    const keys = ownKeys(current);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (isSymbol(key)) invalidGraph();
      const descriptor = getOwnPropertyDescriptor(current, key);
      if (!descriptor || !('value' in descriptor)) invalidGraph();
      pending = { value: descriptor.value, next: pending };
    }
  }

  while (nodes) {
    freeze(nodes.value);
    nodes = nodes.next;
  }
  return input as t.DeepReadonly<typeof input>;
};

function invalidGraph(): never {
  throw new NativeTypeError(CONTRACT_ERROR);
}
