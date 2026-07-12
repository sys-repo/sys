import { act, DomMock } from '../../../-test.ts';

export function keydown(el: EventTarget, key: string, init: KeyboardEventInit = {}) {
  const event = DomMock.Keyboard.keydownEvent(key, { bubbles: true, cancelable: true, ...init });
  act(() => el.dispatchEvent(event));
  return event;
}
