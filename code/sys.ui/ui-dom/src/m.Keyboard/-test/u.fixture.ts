import { DomMock } from '../../-test.ts';

export function keydown(key: string) {
  return DomMock.Keyboard.keydownEvent(key, { bubbles: true, cancelable: true });
}

export function keyup(key: string) {
  return DomMock.Keyboard.keyupEvent(key, { bubbles: true, cancelable: true });
}

export function releaseKey(key: string) {
  DomMock.Keyboard.fire(keyup(key));
}
