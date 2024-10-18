/**
 * @module
 * Tools for working with the DOM (Document Object Model).
 *
 * @example
 * ```ts
 * import { Color } from '@sys/ui-dom/color';
 * import { Color, Style, css } from '@sys/ui-dom/style/react';
 * ```
 *
 * @example
 * To mock the DOM on the server:
 * ```ts
 * import { Mock } from '@sys/ui-dom/mock';
 * Mock.polyfill();
 * ```
 */
export { Pkg } from './common.ts';
export { Color } from './m.Color/mod.ts';
export { File } from './m.File/mod.ts';
export { Keyboard } from './m.Keyboard/mod.ts';
export { LocalStorage } from './m.LocalStorage/mod.ts';
