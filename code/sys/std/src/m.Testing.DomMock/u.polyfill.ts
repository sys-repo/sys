import { Window } from 'happy-dom';
import type { t } from './common.ts';

let _window: Window | undefined;
let _closing = Promise.resolve();
const windows = new Set<Window>();

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
export const polyfill: t.DomMock.Lib['polyfill'] = (options = {}) => {
  const { url = 'http://localhost:1234' } = options;

  // If a custom URL is requested, force a new Window so location updates.
  // Otherwise reuse existing instance.
  const forceNew = !!options.url;
  const win = forceNew ? new Window({ url }) : _window || new Window({ url });

  _window = win;
  windows.add(win);
  applyGlobals(win);
};

/**
 * Returns `globalThis` to its original state and closes every detached HappyDOM window.
 *
 * Contract (as exercised by std tests):
 * - Global restoration is synchronous.
 * - The returned promise settles after HappyDOM has cancelled its internal async tasks.
 * - After unpolyfill, the next polyfill creates a NEW Window instance.
 */
export const unpolyfill: t.DomMock.Lib['unpolyfill'] = () => {
  _window = undefined;

  restore('window', ORIGINAL.window);
  restore('document', ORIGINAL.document);
  restore('MediaStream', ORIGINAL.MediaStream);
  restore('MediaStreamTrack', ORIGINAL.MediaStreamTrack);
  restore('HTMLElement', ORIGINAL.HTMLElement);
  restore('self', ORIGINAL.self);
  restore('__SYS_BROWSER_MOCK__', ORIGINAL.__SYS_BROWSER_MOCK__);

  const closing = [...windows];
  windows.clear();
  if (closing.length === 0) return _closing;

  const previous = _closing.catch(() => undefined);
  const current = previous.then(async () => {
    const results = await Promise.allSettled(closing.map((win) => win.happyDOM.close()));
    const errors: unknown[] = [];
    for (const result of results) {
      if (result.status === 'rejected') errors.push(result.reason);
    }

    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, 'Failed to close every tracked HappyDOM window.');
    }
  });

  // A failed close belongs to this call; do not poison later teardown attempts.
  _closing = current.catch(() => undefined);
  return current;
};
