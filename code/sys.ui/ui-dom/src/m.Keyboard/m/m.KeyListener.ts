import { Rx, type t } from '../common.ts';

type KeyHandler = (e: KeyboardEvent) => unknown;

/** Raw keydown and keyup listener helpers. */
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
