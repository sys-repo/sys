import { type t, UserAgent } from './common.ts';
import { Util } from './u.ts';

export const Is: t.KeyboardIsLib = {
  command(input, options = {}) {
    const modifiers = Util.toModifiers(input);
    if (!modifiers) return false;

    const ua = options.ua ?? UserAgent.current;
    const cmd =
      ua.is.macOS || ua.is.iOS || ua.is.iPad || ua.is.iPhone
        ? modifiers.meta //   ⌘ on Apple devices
        : modifiers.ctrl; //  Ctrl everywhere else.

    return cmd ?? false;
  },

  modified(input) {
    const modifiers = Util.toModifiers(input);
    if (!modifiers) return false;
    return Object.values(modifiers ?? {}).some(Boolean);
  },

  copy(e, options = {}) {
    if (!e) return false;
    return e.key === 'c' && Is.command(e.modifiers, options);
  },
};
