/**
 * @module
 * Tools for working with the DOM (Document Object Model).
 *
 * @example
 * Importing tools for styling.
 * ```ts
 * import { Color } from '@sys/ui-dom';   // ← NB: alias from '@sys/std/color'
 * import { Color, Style } from '@sys/ui-css';
 * import { Color, Style, css } from '@sys/ui-css/react';
 * ```
 *
 * @example
 * To work with local-storage in a strongly typed way:
 * ```ts
 * import { LocalStorage } from '@sys/ui-dom/local-storage';
 *
 * type T = { count: number; msg?: string };
 * const localstore = LocalStorage<T>('my-namespace-prefix');
 * const local = localstore.object({ count: 0 });
 * ```
 *
 * @example
 * To work with global keyboard events.
 *
 * ```ts
 * import { Keyboard } from '@sys/ui-dom/keyboard';
 *
 * const life = rx.disposable();
 * const until = Keyboard.until(life.dispose$);
 *
 * until.on('KeyZ', (e) => {
 *   console.log('Z', e);
 * });
 *
 * life.dispose();
 * ```
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

export { File } from './m.File/mod.ts';
export { Kbd, Keyboard } from './m.Keyboard/mod.ts';
export { LocalStorage } from './m.LocalStorage/mod.ts';
export { Url } from './m.Url/mod.ts';
export { Dom } from './m.Dom/mod.ts';
