/**
 * @module
 * Tools for working with global keyboard events.
 *
 * @example
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

export { KeyboardMonitor } from './m.Keyboard.Monitor.ts';
export { Keyboard } from './m.Keyboard.ts';
export { KeyListener } from './m.KeyListener.ts';
