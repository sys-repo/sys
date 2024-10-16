export type * from './m.Events/t.ts';
export type * from './m.File/t.ts';
export type * from './m.Keyboard/t.ts';
export type * from './m.LocalStorage/t.ts';
export type * from './m.Mock/t.ts';
export type * from './m.UserAgent/t.ts';

/**
 * Size and position of a rectangle.
 * https://developer.mozilla.org/en-US/docs/Web/API/DOMRect
 */
export type DomRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};
