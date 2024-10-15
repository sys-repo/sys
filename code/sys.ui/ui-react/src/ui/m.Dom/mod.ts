/**
 * @module
 * Tools for working directly with the raw DOM ("document object model")
 * without involvement with any other UI libraries.
 *
 * @example
 * To work with local-storage in a strongly typed manner:
 *
 * ```ts
 * import { LocalStorage } from '@sys/ui-react/ui/dom';
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
export { File } from './m.File/mod.ts';
export { Keyboard } from './m.Keyboard/mod.ts';
export { UserAgent } from './m.UserAgent/mod.ts';
export { LocalStorage } from './m.LocalStorage/mod.ts';
