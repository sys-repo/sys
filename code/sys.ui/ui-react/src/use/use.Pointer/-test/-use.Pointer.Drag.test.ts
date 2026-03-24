import { act, afterEach, beforeEach, describe, DomMock, expect, it, renderHook } from '../../../-test.ts';
import { usePointerDrag } from '../use.Pointer.Drag.ts';

describe('usePointerDrag', () => {
  DomMock.init({ beforeEach, afterEach });

  it('touch move events trigger drag updates after start()', () => {
    withPatchedDocument((ctx) => {
      const calls: number[] = [];

      const { result, unmount } = renderHook(() =>
        usePointerDrag({
          onDrag: (e) => calls.push(e.client.x),
        }),
      );

      try {
        act(() => result.current.start());
        const move = ctx.listeners.get('touchmove');
        expect(typeof move).to.eql('function');

        act(() => {
          move?.(fakeTouchMove({ x: 10, y: 10 }));
          move?.(fakeTouchMove({ x: 20, y: 10 }));
        });

        expect(calls.length).to.eql(1);
        expect(calls[0]).to.eql(20);
      } finally {
        act(() => unmount());
      }
    });
  });

  it('supports mouse drag session even when touch capability exists', () => {
    withPatchedDocument((ctx) => {
      const calls: number[] = [];
      const prevOntouchstart = (window as Window & { ontouchstart?: unknown }).ontouchstart;
      (window as Window & { ontouchstart?: unknown }).ontouchstart = (() => {}) as (
        this: GlobalEventHandlers,
        ev: TouchEvent,
      ) => unknown;

      const { result, unmount } = renderHook(() =>
        usePointerDrag({
          onDrag: (e) => calls.push(e.client.x),
        }),
      );

      try {
        act(() => result.current.start());
        const move = ctx.listeners.get('mousemove');
        expect(typeof move).to.eql('function');

        act(() => {
          move?.(fakeMouseMove({ x: 12, y: 10 }));
          move?.(fakeMouseMove({ x: 16, y: 10 }));
        });
        expect(calls).to.eql([16]);
      } finally {
        act(() => unmount());
        (window as Window & { ontouchstart?: unknown }).ontouchstart = prevOntouchstart;
      }
    });
  });

  it('ignores stale callbacks from a cancelled prior session', () => {
    withPatchedDocument((ctx) => {
      const calls: number[] = [];

      const { result, unmount } = renderHook(() =>
        usePointerDrag({
          onDrag: (e) => calls.push(e.client.x),
        }),
      );

      try {
        act(() => result.current.start());
        const firstMove = ctx.listeners.get('mousemove');
        expect(typeof firstMove).to.eql('function');

        act(() => result.current.cancel());

        act(() => result.current.start());
        const secondMove = ctx.listeners.get('mousemove');
        expect(typeof secondMove).to.eql('function');
        expect(firstMove).not.to.equal(secondMove);

        act(() => {
          firstMove?.(fakeMouseMove({ x: 30, y: 10 }));
          firstMove?.(fakeMouseMove({ x: 34, y: 10 }));
          secondMove?.(fakeMouseMove({ x: 10, y: 10 }));
          secondMove?.(fakeMouseMove({ x: 14, y: 10 }));
        });

        expect(calls).to.eql([14]);
      } finally {
        act(() => unmount());
      }
    });
  });

  it('start is idempotent and does not re-register listeners', () => {
    withPatchedDocument((ctx) => {
      const { result, unmount } = renderHook(() => usePointerDrag({ onDrag: () => {} }));

      try {
        act(() => result.current.start());
        const firstCounts = toObject(ctx.addCounts);

        act(() => result.current.start());
        const secondCounts = toObject(ctx.addCounts);

        expect(secondCounts).to.eql(firstCounts);
      } finally {
        act(() => unmount());
      }
    });
  });

  it('removes all listeners when drag session ends from mouseup and touchcancel', () => {
    withPatchedDocument((ctx) => {
      const { result, unmount } = renderHook(() => usePointerDrag({ onDrag: () => {} }));

      try {
        act(() => result.current.start());
        expect(activeListenerTypes(ctx.listeners)).to.eql(EXPECTED_DRAG_LISTENERS);

        const onMouseUp = ctx.listeners.get('mouseup');
        expect(typeof onMouseUp).to.eql('function');
        act(() => onMouseUp?.(new window.Event('mouseup')));
        expect(activeListenerTypes(ctx.listeners)).to.eql([]);

        act(() => result.current.start());
        expect(activeListenerTypes(ctx.listeners)).to.eql(EXPECTED_DRAG_LISTENERS);
        const onTouchCancel = ctx.listeners.get('touchcancel');
        expect(typeof onTouchCancel).to.eql('function');
        act(() => onTouchCancel?.(new window.Event('touchcancel')));
        expect(activeListenerTypes(ctx.listeners)).to.eql([]);
      } finally {
        act(() => unmount());
      }
    });
  });

  it('locks input source to first move kind for a session', () => {
    withPatchedDocument((ctx) => {
      const calls: number[] = [];
      const { result, unmount } = renderHook(() =>
        usePointerDrag({
          onDrag: (e) => calls.push(e.client.x),
        }),
      );

      try {
        act(() => result.current.start());
        const touchMove = ctx.listeners.get('touchmove');
        const mouseMove = ctx.listeners.get('mousemove');
        expect(typeof touchMove).to.eql('function');
        expect(typeof mouseMove).to.eql('function');

        act(() => {
          touchMove?.(fakeTouchMove({ x: 10, y: 10 }));
          touchMove?.(fakeTouchMove({ x: 20, y: 10 }));
          mouseMove?.(fakeMouseMove({ x: 40, y: 10 }));
          mouseMove?.(fakeMouseMove({ x: 44, y: 10 }));
        });
        expect(calls).to.eql([20]);

        act(() => {
          result.current.cancel();
          result.current.start();
        });

        const touchMove2 = ctx.listeners.get('touchmove');
        const mouseMove2 = ctx.listeners.get('mousemove');
        expect(typeof touchMove2).to.eql('function');
        expect(typeof mouseMove2).to.eql('function');

        act(() => {
          mouseMove2?.(fakeMouseMove({ x: 12, y: 10 }));
          mouseMove2?.(fakeMouseMove({ x: 16, y: 10 }));
          touchMove2?.(fakeTouchMove({ x: 30, y: 10 }));
          touchMove2?.(fakeTouchMove({ x: 34, y: 10 }));
        });
        expect(calls).to.eql([20, 16]);
      } finally {
        act(() => unmount());
      }
    });
  });
});

function withPatchedDocument(run: (ctx: PatchCtx) => void) {
  const originalAdd = document.addEventListener.bind(document);
  const originalRemove = document.removeEventListener.bind(document);

  const listeners = new Map<string, EventListener>();
  const addCounts = new Map<string, number>();

  document.addEventListener = ((
    type: string,
    listener: EventListenerOrEventListenerObject,
    _options?: boolean | AddEventListenerOptions,
  ) => {
    listeners.set(type, listener as EventListener);
    addCounts.set(type, (addCounts.get(type) ?? 0) + 1);
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
    run({ listeners, addCounts });
  } finally {
    document.addEventListener = originalAdd as Document['addEventListener'];
    document.removeEventListener = originalRemove as Document['removeEventListener'];
  }
}

type PatchCtx = {
  listeners: Map<string, EventListener>;
  addCounts: Map<string, number>;
};

const EXPECTED_DRAG_LISTENERS = [
  'mousemove',
  'mouseup',
  'selectstart',
  'touchcancel',
  'touchend',
  'touchmove',
] as const;

function toObject(map: Map<string, number>): Record<string, number> {
  const entries: [string, number][] = [];
  for (const [key, value] of map.entries()) {
    entries.push([key, value]);
  }
  return Object.fromEntries(entries);
}

function activeListenerTypes(listeners: Map<string, EventListener>) {
  return [...listeners.keys()].filter((key) =>
    EXPECTED_DRAG_LISTENERS.includes(key as (typeof EXPECTED_DRAG_LISTENERS)[number])
  ).sort();
}

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

function fakeMouseMove(point: { x: number; y: number }): MouseEvent {
  return {
    clientX: point.x,
    clientY: point.y,
    movementX: point.x,
    movementY: point.y,
    screenX: point.x,
    screenY: point.y,
    button: 0,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    preventDefault() {},
  } as MouseEvent;
}
