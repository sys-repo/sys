import { afterAll, beforeAll, describe, DomMock, expect, it, renderHook } from '../../../-test.ts';
import { usePointerDrag } from '../use.Pointer.Drag.ts';

describe('usePointerDrag', () => {
  DomMock.init({ beforeAll, afterAll });

  it('touch move events trigger drag updates after start()', () => {
    const prevOntouchstart = (window as Window & { ontouchstart?: unknown }).ontouchstart;
    (window as Window & { ontouchstart?: unknown }).ontouchstart = (() => {}) as (
      this: GlobalEventHandlers,
      ev: TouchEvent,
    ) => unknown;

    const originalAdd = document.addEventListener.bind(document);
    const originalRemove = document.removeEventListener.bind(document);
    const listeners = new Map<string, EventListener>();
    const calls: number[] = [];

    document.addEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      _options?: boolean | AddEventListenerOptions,
    ) => {
      listeners.set(type, listener as EventListener);
      return;
    }) as Document['addEventListener'];

    document.removeEventListener = ((
      type: string,
      _listener: EventListenerOrEventListenerObject,
      _options?: boolean | EventListenerOptions,
    ) => {
      listeners.delete(type);
      return;
    }) as Document['removeEventListener'];

    try {
      const { result, unmount } = renderHook(() =>
        usePointerDrag({
          onDrag: (e) => calls.push(e.client.x),
        }),
      );

      try {
        result.current.start();
        const move = listeners.get('touchmove');
        expect(typeof move).to.eql('function');

        const e1 = fakeTouchMove({ x: 10, y: 10 });
        const e2 = fakeTouchMove({ x: 20, y: 10 });
        move?.(e1);
        move?.(e2);

        expect(calls.length).to.eql(1);
        expect(calls[0]).to.eql(20);
      } finally {
        unmount();
      }
    } finally {
      document.addEventListener = originalAdd as Document['addEventListener'];
      document.removeEventListener = originalRemove as Document['removeEventListener'];
      (window as Window & { ontouchstart?: unknown }).ontouchstart = prevOntouchstart;
    }
  });
});

function fakeTouchMove(point: { x: number; y: number }): TouchEvent {
  const touch = { clientX: point.x, clientY: point.y, screenX: point.x, screenY: point.y };
  return {
    touches: [touch] as unknown as TouchList,
    changedTouches: [touch] as unknown as TouchList,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    preventDefault() {},
  } as TouchEvent;
}
