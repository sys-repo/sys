export { pkg, R, type t } from './common/mod.ts';
export { c } from './m.Ansi/mod.ts';
export { Time } from './m.DateTime/mod.ts';
export * from './m.Testing/mod.ts';

/**
 * DomMock:
 */
import { Window } from 'happy-dom';

const g = globalThis as any;
let _window: Window | undefined;

const ORIGINAL = {
  window: globalThis.window,
  document: globalThis.document,
} as const;

/**
 * Ensure `globalThis` is polyfilled with window/document.
 */
const polyfill = (options: { url?: string } = {}) => {
  const { url = 'http://localhost:1234' } = options;
  const window = _window || (_window = new Window({ url }));
  g.window = window;
  g.document = window.document;
};

/**
 * Returns the `globalThis` to it's original state.
 */
const unpolyfill = () => {
  g.window = ORIGINAL.window;
  g.document = ORIGINAL.document;
  _window = undefined;
};

export const DomMock = { polyfill, unpolyfill } as const;
