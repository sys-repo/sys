import { Is as IsBase } from '@sys/std/is/server';
import type { t } from './common.ts';

/**
 * Predicates for canonical keyboard controls and listener failures.
 */
export const Is: t.CliKeyboard.Is.Lib = Object.freeze({
  quit(event: t.CliKeyboard.Is.QuitInput): boolean {
    const key = event.key?.toLowerCase();
    return key === 'q' || (key === 'c' && event.ctrlKey === true);
  },

  redraw(event: t.CliKeyboard.Is.RedrawInput): boolean {
    return event.key === 'r' && event.ctrlKey === false && event.altKey === false &&
      event.metaKey === false && event.shiftKey === false;
  },

  unavailableError(error: unknown): boolean {
    if (!IsBase.object(error)) return false;
    try {
      if (IsBase.Native.proxy(error) || !IsBase.Native.error(error)) return false;
      const name = ownString(error, 'name');
      if (name === 'BadResource') return true;
      const message = ownString(error, 'message');
      return message !== undefined &&
        /ENODEV|ENOTTY|No such device|Not a typewriter/i.test(message);
    } catch {
      return false;
    }
  },
});

/**
 * Helpers:
 */
function ownString(input: object, key: 'message' | 'name'): string | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor && 'value' in descriptor && IsBase.string(descriptor.value)
    ? descriptor.value
    : undefined;
}
