import type { t } from '../common.ts';

export type KeypressControl = {
  readonly nativeEvent: KeyboardEvent;
  keyboardPropagationStopped: boolean;
  consumed: boolean;
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

export const KeyboardControl = {
  create(nativeEvent: KeyboardEvent): KeypressControl {
    return {
      nativeEvent,
      keyboardPropagationStopped: false,
      consumed: false,
    };
  },

  bind(event: t.Keyboard.Keypress.Event, control: KeypressControl) {
    keypressControls.set(event, control);
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
} as const;
