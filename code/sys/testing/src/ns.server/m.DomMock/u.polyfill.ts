import { Window } from 'happy-dom';
import type { t } from '../common.ts';

const g = globalThis as any;
let _window: Window | undefined;

const ORIGINAL = {
  window: globalThis.window,
  document: globalThis.document,
} as const;

/**
 * Ensure `globalThis` is polyfilled with window/document.
 */
export const polyfill: t.DomMockLib['polyfill'] = (options = {}) => {
  const { url = 'http://localhost:1234' } = options;
  const window = _window || (_window = new Window({ url }));
  g.window = window;
  g.document = window.document;
};

/**
 * Returns the `globalThis` to it's original state.
 */
export const unpolyfill: t.DomMockLib['polyfill'] = () => {
  g.window = ORIGINAL.window;
  g.document = ORIGINAL.document;
  _window = undefined;
};
