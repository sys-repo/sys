import { type t } from './common.ts';

/**
 * Safely remove the `dispose` method from a disposable.
 * NB: useful for surfacing from an API where you don't want
 *     callers to be able to disose of the resource.
 */
export function omitDispose<T extends t.Disposable>(obj: T): Omit<T, 'dispose'> {
  const proto = Object.getPrototypeOf(obj);
  const allDescs = Object.getOwnPropertyDescriptors(obj);
  const newDescs: PropertyDescriptorMap = {};

  for (const [key, desc] of Object.entries(allDescs)) {
    if (key === 'dispose') continue; // NB: skip it.
    newDescs[key] = desc;
  }

  return Object.create(proto, newDescs) as Omit<T, 'dispose'>;
}
