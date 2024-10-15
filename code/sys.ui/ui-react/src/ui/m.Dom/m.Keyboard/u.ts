import { UserAgent, type t } from './common';

export const Util = {
  isModifier(value: string) {
    value = (value || '').trim();
    return value === 'META' || value === 'ALT' || value === 'SHIFT' || value === 'CTRL';
  },

  toModifierFlags(input: t.KeyboardModifierKeys): t.KeyboardModifierFlags {
    const flag = (value: t.KeyboardModifierEdges) => (value || []).length > 0;
    return {
      shift: flag(input.shift),
      alt: flag(input.alt),
      ctrl: flag(input.ctrl),
      meta: flag(input.meta),
    };
  },

  toFlags(e: KeyboardEvent): t.KeyboardKeyFlags {
    const os = UserAgent.current.os;
    const mac = os.name === 'Mac OS';
    const windows = os.name === 'Windows';
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

  toStateKey(e: t.KeyboardKeypress): t.KeyboardKey {
    const { is } = e;
    const { key, code, timeStamp: timestamp } = e.keypress;
    return { key, code, is, timestamp };
  },

  toKeypress(e: KeyboardEvent): t.KeyboardKeypress {
    const { code } = e;
    return {
      stage: e.type === 'keydown' ? 'Down' : 'Up',
      code,
      get keypress() {
        return Util.toKeypressProps(e);
      },
      get is() {
        return Util.toFlags(e);
      },
      handled() {
        Util.handled(e);
      },
    };
  },

  toKeypressProps(e: KeyboardEvent): t.KeyboardKeypressProps {
    const { key, code, isComposing, location, repeat } = e;
    const { altKey, ctrlKey, metaKey, shiftKey } = e;
    const { bubbles, cancelable, eventPhase, timeStamp, isTrusted } = e;
    return {
      code,
      key,
      altKey,
      ctrlKey,
      metaKey,
      shiftKey,
      bubbles,
      cancelable,
      eventPhase,
      timeStamp,
      isTrusted,
      isComposing,
      location,
      repeat,
      handled() {
        Util.handled(e);
      },
    };
  },

  handled(e: KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  },
} as const;
