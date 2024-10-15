import { slug, type t } from './common.ts';
import { Util } from './u.ts';

export const Match: t.KeyboardMatchLib = {
  /**
   * Generate a keyboard pattern matcher.
   */
  pattern(input: t.KeyPattern) {
    const pattern = parsePattern(input);
    return {
      /**
       * Parsed key-map pattern, eg "CMD + KeyP" or "META + SHIFT + KeyL + KeyK".
       */
      pattern,

      /**
       * Determine if the given keys match the pattern.
       */
      isMatch(pressed: t.KeyboardKey['code'][], modifiers: Partial<t.KeyboardModifierFlags>) {
        if (!containsAllModifiers(pattern, modifiers)) return false;
        if (!containsAllKeys(pattern, pressed)) return false;
        return true;
      },
    };
  },
} as const;

/**
 * [Helpers]
 */
function parsePattern(pattern: t.KeyPattern): string[] {
  if (typeof pattern !== 'string') pattern = '';
  pattern = pattern.trim();

  // Handle an escaped ("+") character as a value rather than the divider.
  const placeholder = `|${slug()}|`;
  pattern = pattern.replace(/\\\+/g, placeholder);

  return pattern
    .split('+')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      if (value === placeholder) return '+';
      if (value.toUpperCase() === 'CMD') value = 'META';
      if (value.toUpperCase() === 'META') return 'META';
      if (value.toUpperCase() === 'SHIFT') return 'SHIFT';
      if (value.toUpperCase() === 'CTRL') return 'CTRL';
      if (value.toUpperCase() === 'ALT') return 'ALT';
      return value;
    });
}

function containsAllModifiers(pattern: string[], modifiers: Partial<t.KeyboardModifierFlags>) {
  pattern = pattern.filter(Util.isModifier);

  const flags = Object.entries(modifiers)
    .filter(([_key, value]) => Boolean(value))
    .map(([key, _value]) => key.toUpperCase());

  if (!pattern.every((modifier) => flags.includes(modifier))) return false;
  if (flags.some((modifier) => !pattern.includes(modifier))) return false;
  return true;
}

function containsAllKeys(pattern: string[], pressed: string[]) {
  pressed = pressed.map((value) => value.toUpperCase());
  pattern = pattern.filter((value) => !Util.isModifier(value)).map((value) => value.toUpperCase());
  return pattern.every((value) => pressed.includes(value));
}
