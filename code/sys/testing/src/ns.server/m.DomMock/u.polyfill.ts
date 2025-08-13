import { Window } from 'happy-dom';
import type { t } from '../common.ts';

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
  const win = _window || (_window = new Window({ url }));
  Object.assign(globalThis, {
    window: win,
    document: win.document,
    MediaStream: win.MediaStream,
    MediaStreamTrack: win.MediaStreamTrack,
    HTMLElement: win.HTMLElement,
    self: globalThis, // AMD loader checks `self` (if that is ever used by tests).
  });
};

/**
 * Returns the `globalThis` to it's original state.
 */
export const unpolyfill: t.DomMockLib['polyfill'] = () => {
  globalThis.window = ORIGINAL.window;
  globalThis.document = ORIGINAL.document;
  _window = undefined;
};
