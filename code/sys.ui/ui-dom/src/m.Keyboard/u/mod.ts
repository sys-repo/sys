import { KeyboardControl } from './u.control.ts';
import { KeyboardKeypress } from './u.keypress.ts';
import { KeyboardModifiers } from './u.modifiers.ts';

export const Util = {
  isModifier: KeyboardModifiers.isModifier,
  toModifierFlags: KeyboardModifiers.toModifierFlags,
  toModifiers: KeyboardModifiers.toModifiers,
  toFlags: KeyboardModifiers.toFlags,
  toStateKey: KeyboardModifiers.toStateKey,

  toKeypress: KeyboardKeypress.toKeypress,
  toKeypressProps: KeyboardKeypress.toKeypressProps,

  preventDefault: KeyboardControl.preventDefault,
  stopKeyboardPropagation: KeyboardControl.stopKeyboardPropagation,
  consume: KeyboardControl.consume,
  isKeyboardPropagationStopped: KeyboardControl.isKeyboardPropagationStopped,
  handled: KeyboardControl.handled,
} as const;
