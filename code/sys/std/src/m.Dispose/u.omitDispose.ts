import { Is, type t } from './common.ts';
import { requireSymbolAsyncDispose, requireSymbolDispose } from './u.native.ts';

type L = t.Lifecycle | t.LifecycleAsync;
type DisposalAuthorityKey = 'dispose' | typeof Symbol.dispose | typeof Symbol.asyncDispose;

/**
 * Safely remove direct and native disposal authority from an observable lifecycle.
 * Retained property reads and methods delegate to the source so branded behavior remains callable.
 * NB: useful for surfacing from an API where callers must only observe
 *     the resource lifecycle.
 */
export function omitDispose<T extends L>(obj: T): t.OmitDisposable<T> {
  requireSymbolDispose();
  requireSymbolAsyncDispose();
  const authorityKeys = ['dispose', Symbol.dispose, Symbol.asyncDispose] as const;
  const hasAsyncProtocol = hasPropertyDescriptor(obj, Symbol.asyncDispose);
  const proto = Object.getPrototypeOf(obj);
  const newDescs: PropertyDescriptorMap = {};
  const methods = new WeakMap<Function, Function>();
  let projection: t.OmitDisposable<T>;

  const projectMethod = (value: Function) => {
    const existing = methods.get(value);
    if (existing) return existing;

    let method: Function;
    method = new Proxy(value, {
      apply(target, _receiver, args) {
        const result = Reflect.apply(target, obj, args);
        return result === obj ? projection : result;
      },
      construct(target, args, newTarget) {
        const receiver = newTarget === method ? target : newTarget;
        const result = Reflect.construct(target, args, receiver);
        return result === obj ? projection : result;
      },
    });
    methods.set(value, method);
    return method;
  };

  for (const key of Reflect.ownKeys(obj)) {
    if (authorityKeys.includes(key as DisposalAuthorityKey)) continue;

    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (!descriptor) continue;

    const value = 'value' in descriptor ? descriptor.value : undefined;
    newDescs[key] = key !== 'constructor' && Is.func(value)
      ? { ...descriptor, value: projectMethod(value) }
      : descriptor;
  }

  for (const key of authorityKeys) {
    // Keep an undefined async marker so runtime guards can distinguish its telemetry after authority
    // removal. Undefined remains non-callable under the native protocol.
    const preservesAsyncCategory = key === Symbol.asyncDispose && hasAsyncProtocol;
    if (!preservesAsyncCategory && !hasPropertyDescriptor(proto, key)) continue;
    newDescs[key] = {
      configurable: true,
      value: undefined,
      writable: true,
    };
  }

  const target = Object.create(proto, newDescs);
  projection = new Proxy(target, {
    get(target, key, receiver) {
      if (isAuthorityKey(key)) return Reflect.get(target, key, receiver);

      const value = Reflect.get(obj, key, obj);
      return Is.func(value) && key !== 'constructor' ? projectMethod(value) : value;
    },
    set(target, key, value, receiver) {
      if (isAuthorityKey(key)) return Reflect.set(target, key, value, receiver);
      return Reflect.set(obj, key, value, obj);
    },
  });

  return projection;
}

function isAuthorityKey(key: PropertyKey): key is DisposalAuthorityKey {
  return key === 'dispose' || key === Symbol.dispose || key === Symbol.asyncDispose;
}

function hasPropertyDescriptor(value: object | null, key: PropertyKey) {
  let current = value;
  while (current) {
    if (Object.getOwnPropertyDescriptor(current, key)) return true;
    current = Object.getPrototypeOf(current);
  }
  return false;
}
