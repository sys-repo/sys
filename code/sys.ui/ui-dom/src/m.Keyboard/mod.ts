/**
 * @module
 * Tools for working with global keyboard events.
 *
 * @example
 * ```ts
 * import { Rx } from '@sys/std/rx';
 * import { Keyboard } from '@sys/ui-dom/keyboard';
 *
 * const life = Rx.lifecycle();
 * const until = Keyboard.until(life.dispose$);
 *
 * until.on('KeyZ', (e) => {
 *   console.log('Z', e);
 * });
 *
 * life.dispose();
 * ```
 */
export { KeyboardMonitor } from './m/m.Keyboard.Monitor.ts';
export { Kbd, Keyboard } from './m/m.Keyboard.ts';
export { KeyListener } from './m/m.KeyListener.ts';
