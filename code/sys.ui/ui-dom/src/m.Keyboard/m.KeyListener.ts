import { type t, Rx } from './common.ts';

type KeyHandler = (e: KeyboardEvent) => unknown;

export const KeyListener: t.Keyboard.Listener.Lib = {
  keydown: listener('keydown'),
  keyup: listener('keyup'),
  get isSupported() {
    return typeof document === 'object';
  },
} as const;

/**
 * Produces an event-binding factory for a keyboard event
 * that is "disposable" (remove event binding).
 */
function listener(event: 'keydown' | 'keyup') {
  return (handler: KeyHandler): t.Keyboard.Listener.Handle => {
    const disposable = Rx.lifecycle();
    const document = globalThis.document;
    document.addEventListener(event, handler);
    disposable.dispose$.subscribe(() => document.removeEventListener(event, handler));
    return disposable;
  };
}
