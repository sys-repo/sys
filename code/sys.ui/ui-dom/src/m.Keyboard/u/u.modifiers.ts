import { isRecord, type t, UserAgent } from '../common.ts';

type O = Record<string, unknown>;

const DEFAULT_MODIFIERS: t.Keyboard.Modifier.Flags = {
  ctrl: false,
  meta: false,
  alt: false,
  shift: false,
};

export const KeyboardModifiers = {
  isModifier(value: string) {
    value = (value || '').trim();
    return value === 'META' || value === 'ALT' || value === 'SHIFT' || value === 'CTRL';
  },

  toModifierFlags(input: t.Keyboard.Modifier.Keys): t.Keyboard.Modifier.Flags {
    const flag = (value: t.Keyboard.Modifier.Edges) => (value || []).length > 0;
    return {
      shift: flag(input.shift),
      alt: flag(input.alt),
      ctrl: flag(input.ctrl),
      meta: flag(input.meta),
    };
  },

  toModifiers(
    e: Partial<t.Keyboard.NativeEventLike | t.Keyboard.EventLike | t.Keyboard.Modifier.Flags> = {},
  ): t.Keyboard.Modifier.Flags {
    type F = t.Keyboard.Modifier.Flags;
    if (!isRecord(e)) return { ...DEFAULT_MODIFIERS };

    if ('ctrlKey' in e || 'shiftKey' in e || 'altKey' in e || 'metaKey' in e) {
      const {
        ctrlKey: ctrl = false,
        shiftKey: shift = false,
        altKey: alt = false,
        metaKey: meta = false,
      } = e;
      return { ctrl, shift, alt, meta };
    }

    const isFlags = (o: O = {}): o is Partial<F> => {
      return 'ctrl' in o || 'shift' in o || 'alt' in o || 'meta' in o;
    };

    const clone = (flags: Partial<F>) => {
      const { ctrl = false, shift = false, alt = false, meta = false } = flags;
      return { ctrl, shift, alt, meta };
    };

    if (isFlags(e)) return clone(e);

    if ('modifiers' in e) {
      if (isFlags(e.modifiers)) return clone(e.modifiers);
    }

    return { ...DEFAULT_MODIFIERS };
  },

  toFlags(e: KeyboardEvent): t.Keyboard.Key.Flags {
    const ua = UserAgent.current;
    const mac = ua.is.apple;
    const windows = ua.os.name === 'Windows';
    const clipboardModifier = mac ? e.metaKey : e.ctrlKey;
    return {
      os: { mac, windows },
      down: e.type === 'keydown',
      up: e.type === 'keyup',
      modifier: ['Shift', 'Alt', 'Control', 'Meta'].includes(e.key),
      number: e.code.startsWith('Digit') || e.code.startsWith('Numpad'),
      letter: e.code.startsWith('Key'),
      arrow: e.code.startsWith('Arrow'),
      enter: e.code === 'Enter',
      escape: e.code === 'Escape',
      handled: e.defaultPrevented,
      alt: e.altKey,
      ctrl: e.ctrlKey,
      meta: e.metaKey,
      shift: e.shiftKey,
      cut: e.code === 'KeyX' && clipboardModifier,
      copy: e.code === 'KeyC' && clipboardModifier,
      paste: e.code === 'KeyV' && clipboardModifier,
    };
  },

  toStateKey(e: t.Keyboard.Keypress.Event): t.Keyboard.Key.Snapshot {
    const { is } = e;
    const { key, code, timeStamp: timestamp } = e.keypress;
    return { key, code, is, timestamp };
  },
} as const;
