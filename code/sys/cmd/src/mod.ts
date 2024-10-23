/**
 * @module
 * An event structure over an `Immutable<T>` that allows for a common event driven
 * remote function invocation pattern to be achieved.
 *
 * @example
 * ```ts
 * import { Cmd } from '@sys/cmd';
 *
 * // Sample
 * export type C = C1 | C2;
 * export type C1 = t.CmdType<'Foo', { foo: number }>;
 * export type C2 = t.CmdType<'Bar', { msg?: string }>;
 *
 * const doc = await generateTransport();
 * const cmd = Cmd.create<C>(doc);
 *
 * cmd.invoke('Foo', { foo: 888 });
 * ```
 */
export { Pkg } from './common.ts';
export { Cmd } from './m.Cmd/mod.ts';
