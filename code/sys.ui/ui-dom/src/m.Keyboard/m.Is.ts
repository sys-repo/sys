import { type t, UserAgent } from './common.ts';

export const Is: t.KeyboardIsLib = {
  commandConcept(modifiers, options = {}) {
    if (!modifiers) return false;
    const ua = options.ua ?? UserAgent.current;

    const meta =
      ua.is.macOS || ua.is.iOS || ua.is.iPad || ua.is.iPhone
        ? modifiers.meta //   ⌘ on Apple devices
        : modifiers.ctrl; //  Ctrl everywhere else.

    return meta ?? false;
  },

  modified(modifiers) {
    if (!modifiers) return false;
    return Object.values(modifiers ?? {}).some(Boolean);
  },

  copy(e, options = {}) {
    if (!e) return false;
    return e.key === 'c' && Is.commandConcept(e.modifiers, options);
  },
};
