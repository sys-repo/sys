import { act, DomMock } from '../../../-test.ts';

type TouchEventType = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
type TouchOptions = { identifier?: number; clientX?: number };

export function button(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[role="button"]');
  if (el === null) throw new Error('Expected Button.');
  return el;
}

export function contentTransform(el: HTMLElement): string {
  const content = el.firstElementChild;
  if (content === null) throw new Error('Expected Button content.');
  const view = el.ownerDocument.defaultView!;
  return view.getComputedStyle(content).transform || 'none';
}

export function key(
  el: HTMLElement,
  type: 'keydown' | 'keyup',
  value: string,
  init: KeyboardEventInit = {},
) {
  const event = DomMock.Keyboard.event(type, value, { bubbles: true, cancelable: true, ...init });
  act(() => el.dispatchEvent(event));
  return event;
}

export function mouse(el: HTMLElement, type: string, init: MouseEventInit = {}) {
  const event = DomMock.Mouse.event(type, { detail: 1, ...init });
  act(() => el.dispatchEvent(event));
  return event;
}

/** Browser interop: compatibility mouse input identifies its touch origin. */
export function compatibilityMouse(el: HTMLElement, type: string) {
  const event = DomMock.Mouse.event(type, { detail: 1 });
  Object.defineProperty(event, 'sourceCapabilities', { value: { firesTouchEvents: true } });
  act(() => el.dispatchEvent(event));
  return event;
}

export function touch(el: HTMLElement, type: TouchEventType, options: TouchOptions = {}) {
  const { identifier = 1, clientX = 0 } = options;
  const point: Touch = {
    identifier,
    target: el,
    clientX,
    clientY: 0,
    pageX: clientX,
    pageY: 0,
    screenX: clientX,
    screenY: 0,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1,
  };
  const ended = type === 'touchend' || type === 'touchcancel';
  const touches = ended ? [] : [point];
  const view = el.ownerDocument.defaultView!;
  const event = new view.TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches,
    targetTouches: touches,
    changedTouches: [point],
  });
  act(() => el.dispatchEvent(event));
  return event;
}
