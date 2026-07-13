import { isRecord, type t, UserAgent } from './common.ts';

type O = Record<string, unknown>;
type KeypressControl = {
  readonly nativeEvent: KeyboardEvent;
  keyboardPropagationStopped: boolean;
  consumed: boolean;
};

const DEFAULT_MODIFIERS: t.Keyboard.Modifier.Flags = {
  ctrl: false,
  meta: false,
  alt: false,
  shift: false,
};
const keypressControls = new WeakMap<t.Keyboard.Keypress.Event, KeypressControl>();

function controlFor(e: t.Keyboard.Keypress.Event): KeypressControl {
  const control = keypressControls.get(e);
  if (!control) throw new Error('Keyboard keypress control not found.');
  return control;
}

function preventDefaultWith(control: KeypressControl) {
  control.nativeEvent.preventDefault();
}

function stopKeyboardPropagationWith(control: KeypressControl) {
  control.keyboardPropagationStopped = true;
}

function consumeWith(control: KeypressControl) {
  preventDefaultWith(control);
  stopKeyboardPropagationWith(control);
  control.nativeEvent.stopPropagation();
  control.nativeEvent.stopImmediatePropagation();
  control.consumed = true;
}

export const Util = {
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

  toKeypress(e: KeyboardEvent): t.Keyboard.Keypress.Event {
    const { code } = e;
    const control: KeypressControl = {
      nativeEvent: e,
      keyboardPropagationStopped: false,
      consumed: false,
    };
    const event: t.Keyboard.Keypress.Event = {
      stage: e.type === 'keydown' ? 'Down' : 'Up',
      code,
      get keypress() {
        return Util.toKeypressProps(e, control);
      },
      get is() {
        return Util.toFlags(e);
      },
      handled() {
        consumeWith(control);
      },
    };
    keypressControls.set(event, control);
    return event;
  },

  toKeypressProps(e: KeyboardEvent, control?: KeypressControl): t.Keyboard.Keypress.Props {
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
        control ? consumeWith(control) : Util.handled(e);
      },
    };
  },

  preventDefault(e: t.Keyboard.Keypress.Event) {
    preventDefaultWith(controlFor(e));
  },

  stopKeyboardPropagation(e: t.Keyboard.Keypress.Event) {
    stopKeyboardPropagationWith(controlFor(e));
  },

  consume(e: t.Keyboard.Keypress.Event) {
    consumeWith(controlFor(e));
  },

  isKeyboardPropagationStopped(e: t.Keyboard.Keypress.Event) {
    const control = keypressControls.get(e);
    return Boolean(control?.keyboardPropagationStopped || control?.consumed);
  },

  handled(e: KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  },
} as const;
