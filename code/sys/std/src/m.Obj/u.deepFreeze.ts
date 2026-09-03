import { Is, type t } from './common.ts';

const CONTRACT_ERROR =
  'Obj.deepFreeze expected primitive leaves in a data-property graph of plain objects and arrays.';

/**
 * Deeply freeze a trusted, caller-owned plain-data graph without recursive stack growth.
 *
 * Validation completes before any mutable node is frozen. Every own string-keyed data property is
 * traversed, including non-enumerable properties. Proxies, deliberately forged prototype chains,
 * and compromised realms are outside this primitive's trust boundary.
 */
export const deepFreeze: t.Obj.Lib['deepFreeze'] = (input) => {
  const pending: unknown[] = [input];
  const seen = new Set<object>();
  const nodes: object[] = [];

  while (pending.length > 0) {
    const current = pending.pop();

    if (!Is.object(current)) {
      const primitive = Is.nil(current) ||
        Is.str(current) ||
        Is.bool(current) ||
        Is.num(current) ||
        Object.is(current, Number.NaN);
      if (!primitive) invalidGraph();
      continue;
    }

    if (seen.has(current)) continue;

    const prototype = Object.getPrototypeOf(current);
    const supportedNode = Is.array(current)
      ? Is.array(prototype)
      : prototype === Object.prototype || prototype === null;
    if (!supportedNode) invalidGraph();

    seen.add(current);
    nodes.push(current);

    for (const key of Reflect.ownKeys(current)) {
      if (Is.symbol(key)) invalidGraph();
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (!descriptor) invalidGraph();
      if (!('value' in descriptor)) invalidGraph();
      pending.push(descriptor.value);
    }
  }

  for (let index = nodes.length - 1; index >= 0; index--) Object.freeze(nodes[index]);
  return input as t.DeepReadonly<typeof input>;
};

function invalidGraph(): never {
  throw new TypeError(CONTRACT_ERROR);
}
