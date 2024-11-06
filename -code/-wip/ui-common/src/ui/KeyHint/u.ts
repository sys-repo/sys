import { DEFAULTS, type t } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  text(props: Pick<t.KeyHintProps, 'text' | 'parse' | 'os'>) {
    const { text = DEFAULTS.text, parse = DEFAULTS.parse } = props;
    if (!props.text || !parse) return text;
    if (text === DEFAULTS.text) return text;
    const os = Wrangle.os(props.os);

    const parts = text
      .split(' ')
      .map((text) => text.trim())
      .filter(Boolean)
      .filter((char) => char !== '+')
      .map((char) => Wrangle.parseChar(char, os));

    return parts.join(' ');
  },

  parseChar(char: string, os: t.UserAgentOSKind) {
    os = Wrangle.os(os);
    const modifiers = DEFAULTS.modifiers[os as keyof typeof DEFAULTS.modifiers];
    let upper = char.toUpperCase();

    if (upper === 'CMD') upper = 'META';
    if (upper === 'META') char = modifiers.meta;
    if (upper === 'SHIFT') char = modifiers.shift;
    if (upper === 'ALT') char = modifiers.alt;
    if (upper === 'CTRL') char = modifiers.ctrl;

    return char;
  },

  os(os: t.UserAgentOSKind = DEFAULTS.os) {
    if (os === 'android') os = 'posix';
    if (os === 'iOS' || os === 'UNKNOWN') os = DEFAULTS.os;
    return os;
  },
} as const;
