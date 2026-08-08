import type { t } from './common.ts';
import { requireSymbolAsyncDispose, requireSymbolDispose } from './u.native.ts';

type D = t.Disposable | t.DisposableAsync;
type DisposalAuthorityKey = 'dispose' | typeof Symbol.dispose | typeof Symbol.asyncDispose;

/**
 * Safely remove direct and native disposal authority from a disposable.
 * NB: useful for surfacing from an API where callers must only observe
 *     the resource lifecycle.
 */
export function omitDispose<T extends D>(obj: T): Omit<T, DisposalAuthorityKey> {
  requireSymbolDispose();
  requireSymbolAsyncDispose();
  const authorityKeys = ['dispose', Symbol.dispose, Symbol.asyncDispose] as const;
  const proto = Object.getPrototypeOf(obj);
  const newDescs: PropertyDescriptorMap = {};

  for (const key of Reflect.ownKeys(obj)) {
    if (authorityKeys.includes(key as DisposalAuthorityKey)) continue;

    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (descriptor) newDescs[key] = descriptor;
  }

  for (const key of authorityKeys) {
    if (!hasPropertyDescriptor(proto, key)) continue;
    newDescs[key] = {
      configurable: true,
      value: undefined,
      writable: true,
    };
  }

  return Object.create(proto, newDescs) as Omit<T, DisposalAuthorityKey>;
}

function hasPropertyDescriptor(value: object | null, key: PropertyKey) {
  let current = value;
  while (current) {
    if (Object.getOwnPropertyDescriptor(current, key)) return true;
    current = Object.getPrototypeOf(current);
  }
  return false;
}
