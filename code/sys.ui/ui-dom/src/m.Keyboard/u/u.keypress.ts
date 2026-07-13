import type { t } from '../common.ts';
import { KeyboardControl, type KeypressControl } from './u.control.ts';
import { KeyboardModifiers } from './u.modifiers.ts';

export const KeyboardKeypress = {
  toKeypress(e: KeyboardEvent): t.Keyboard.Keypress.Event {
    const { code } = e;
    const control = KeyboardControl.create(e);
    const event: t.Keyboard.Keypress.Event = {
      stage: e.type === 'keydown' ? 'Down' : 'Up',
      code,
      get keypress() {
        return KeyboardKeypress.toKeypressProps(e, control);
      },
      get is() {
        return KeyboardModifiers.toFlags(e);
      },
      handled() {
        KeyboardControl.consumeControl(control);
      },
    };
    KeyboardControl.bind(event, control);
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
        control ? KeyboardControl.consumeControl(control) : KeyboardControl.handled(e);
      },
    };
  },
} as const;
