import { act, DomMock } from '../../../-test.ts';

export function keydown(el: EventTarget, key: string, init: KeyboardEventInit = {}) {
  const event = DomMock.Keyboard.keydownEvent(key, { bubbles: true, cancelable: true, ...init });
  act(() => el.dispatchEvent(event));
  return event;
}

export function globalKeydown(key: string, init: KeyboardEventInit = {}) {
  const event = DomMock.Keyboard.keydownEvent(key, { bubbles: true, cancelable: true, ...init });
  act(() => DomMock.Keyboard.fire(event));
  return event;
}

export function releaseGlobalKey(key: string, init: KeyboardEventInit = {}) {
  const event = DomMock.Keyboard.keyupEvent(key, { bubbles: true, cancelable: true, ...init });
  act(() => DomMock.Keyboard.fire(event));
  return event;
}
