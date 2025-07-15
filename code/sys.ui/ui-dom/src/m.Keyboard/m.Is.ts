import { type t, UserAgent } from './common.ts';

export const Is: t.KeyboardIsLib = {
  commandConcept(input, options = {}) {
    const modifiers = wrangle.modifiers(input);
    if (!modifiers) return false;
    const ua = options.ua ?? UserAgent.current;
    const meta =
      ua.is.macOS || ua.is.iOS || ua.is.iPad || ua.is.iPhone
        ? modifiers.meta //   ⌘ on Apple devices
        : modifiers.ctrl; //  Ctrl everywhere else.
    return meta ?? false;
  },

  modified(input) {
    const modifiers = wrangle.modifiers(input);
    if (!modifiers) return false;
    return Object.values(modifiers ?? {}).some(Boolean);
  },

  copy(e, options = {}) {
    if (!e) return false;
    return e.key === 'c' && Is.commandConcept(e.modifiers, options);
  },
};

/**
 * Helpers:
 */
type P = Partial<t.KeyboardModifierFlags>;
const wrangle = {
  modifiers(input?: P | t.KeyEventLike): t.KeyboardModifierFlags | undefined {
    if (!input) return undefined;

    // Extract the source object that actually holds the modifier booleans.
    const source = 'modifiers' in input ? (input.modifiers as P) : input;

    // Coerce to a complete, truthy/falsey-safe record.
    const { meta = false, ctrl = false, alt = false, shift = false } = source ?? {};
    return {
      meta: !!meta,
      ctrl: !!ctrl,
      alt: !!alt,
      shift: !!shift,
    };
  },
} as const;
