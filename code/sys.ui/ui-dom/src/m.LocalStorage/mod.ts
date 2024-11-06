/**
 * @module
 * Helper for working with a strongly typed local-storage object.
 *
 * @example
 * ```ts
 * import { LocalStorage } from '@sys/ui-dom/local-storage';
 *
 * type T = { count: number; msg?: string };
 * const localstore = LocalStorage<T>('my-namespace-prefix');
 * const local = localstore.object({ count: 0 });
 *
 * expect(local.count).to.eql(0);
 * expect(local.msg).to.eql(undefined);
 *
 * local.count = 123;
 * local.msg = 'hello';
 *
 * expect(local.count).to.eql(123);
 * expect(local.msg).to.eql('hello');
 * ```
 */
export { LocalStorage } from './m.LocalStorage.ts';
