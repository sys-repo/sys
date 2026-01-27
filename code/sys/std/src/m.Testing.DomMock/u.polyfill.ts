import { Window } from 'happy-dom';
import type { t } from './common.ts';

let _window: Window | undefined;

const ORIGINAL = {
  window: (globalThis as any).window,
  document: (globalThis as any).document,
  MediaStream: (globalThis as any).MediaStream,
  MediaStreamTrack: (globalThis as any).MediaStreamTrack,
  HTMLElement: (globalThis as any).HTMLElement,
  self: (globalThis as any).self,
  __SYS_BROWSER_MOCK__: (globalThis as any).__SYS_BROWSER_MOCK__,
} as const;

const restore = (key: string, value: unknown) => {
  if (value === undefined) delete (globalThis as any)[key];
  else (globalThis as any)[key] = value;
};

const applyGlobals = (win: Window) => {
  Object.assign(globalThis, {
    window: win,
    document: win.document,
    MediaStream: win.MediaStream,
    MediaStreamTrack: win.MediaStreamTrack,
    HTMLElement: win.HTMLElement,
    self: globalThis, // AMD loader checks `self`.
  });

  (globalThis as any).__SYS_BROWSER_MOCK__ = true;
};

/**
 * Ensure `globalThis` is polyfilled with window/document.
 *
 * Contract (as exercised by std tests):
 * - Repeated calls reuse the same Window instance.
 * - If called with a custom URL, it must take effect (i.e., create a new Window).
 */
export const polyfill: t.DomMockLib['polyfill'] = (options = {}) => {
  const { url = 'http://localhost:1234' } = options;

  // If a custom URL is requested, force a new Window so location updates.
  // Otherwise reuse existing instance.
  const forceNew = !!options.url;
  const win = forceNew ? new Window({ url }) : _window || new Window({ url });

  _window = win;
  applyGlobals(win);
};

/**
 * Returns `globalThis` to its original state.
 *
 * Contract (as exercised by std tests):
 * - After unpolyfill, the next polyfill must create a NEW Window instance.
 */
export const unpolyfill: t.DomMockLib['unpolyfill'] = () => {
  // Reset instance so next polyfill creates a fresh Window (test expects this).
  _window = undefined;

  restore('window', ORIGINAL.window);
  restore('document', ORIGINAL.document);
  restore('MediaStream', ORIGINAL.MediaStream);
  restore('MediaStreamTrack', ORIGINAL.MediaStreamTrack);
  restore('HTMLElement', ORIGINAL.HTMLElement);
  restore('self', ORIGINAL.self);
  restore('__SYS_BROWSER_MOCK__', ORIGINAL.__SYS_BROWSER_MOCK__);
};
