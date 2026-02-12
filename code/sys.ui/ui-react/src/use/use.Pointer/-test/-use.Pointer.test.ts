import type React from 'react';
import { act, afterAll, beforeAll, describe, DomMock, expect, it, renderHook } from '../../../-test.ts';
import { usePointer } from '../use.Pointer.ts';

describe('usePointer', () => {
  DomMock.init({ beforeAll, afterAll });

  it('does not invoke onUp for pointer cancel/lost-capture and dedupes cancel', () => {
    const upCalls: string[] = [];
    const cancelCalls: string[] = [];

    const { result, unmount } = renderHook(() =>
      usePointer({
        onUp: (e) => upCalls.push(e.type),
        onCancel: (e) => cancelCalls.push(e.type),
      }),
    );

    try {
      const handlers = result.current.handlers as {
        onPointerDown: React.PointerEventHandler;
        onPointerCancel: React.PointerEventHandler;
        onLostPointerCapture: React.PointerEventHandler;
      };
      const target = fakePointerTarget({ hasCapture: true });

      act(() => handlers.onPointerDown(fakePointerEvent('pointerdown', target)));
      act(() => handlers.onPointerCancel(fakePointerEvent('pointercancel', target)));
      act(() => handlers.onLostPointerCapture(fakePointerEvent('lostpointercapture', target)));

      expect(upCalls).to.eql([]);
      expect(cancelCalls).to.eql(['pointercancel']);
    } finally {
      unmount();
    }
  });

  it('does not release pointer capture when not captured', () => {
    const { result, unmount } = renderHook(() => usePointer());

    try {
      const handlers = result.current.handlers as {
        onPointerDown: React.PointerEventHandler;
        onPointerUp: React.PointerEventHandler;
      };
      const target = fakePointerTarget({ hasCapture: false });

      act(() => handlers.onPointerDown(fakePointerEvent('pointerdown', target)));
      act(() => handlers.onPointerUp(fakePointerEvent('pointerup', target)));

      expect(target.calls.set).to.eql(1);
      expect(target.calls.release).to.eql(0);
    } finally {
      unmount();
    }
  });

  it('releases pointer capture when currently captured', () => {
    const { result, unmount } = renderHook(() => usePointer());

    try {
      const handlers = result.current.handlers as {
        onPointerDown: React.PointerEventHandler;
        onPointerUp: React.PointerEventHandler;
      };
      const target = fakePointerTarget({ hasCapture: true });

      act(() => handlers.onPointerDown(fakePointerEvent('pointerdown', target)));
      act(() => handlers.onPointerUp(fakePointerEvent('pointerup', target)));

      expect(target.calls.set).to.eql(1);
      expect(target.calls.release).to.eql(1);
    } finally {
      unmount();
    }
  });

  it('ignores stray pointerup/lost-capture when no press cycle is active', () => {
    const upCalls: string[] = [];
    const cancelCalls: string[] = [];
    const { result, unmount } = renderHook(() =>
      usePointer({
        onUp: (e) => upCalls.push(e.type),
        onCancel: (e) => cancelCalls.push(e.type),
      }),
    );

    try {
      const handlers = result.current.handlers as {
        onPointerUp: React.PointerEventHandler;
        onLostPointerCapture: React.PointerEventHandler;
      };
      const target = fakePointerTarget({ hasCapture: false });

      act(() => handlers.onPointerUp(fakePointerEvent('pointerup', target)));
      act(() => handlers.onLostPointerCapture(fakePointerEvent('lostpointercapture', target)));

      expect(upCalls).to.eql([]);
      expect(cancelCalls).to.eql([]);
    } finally {
      unmount();
    }
  });

  it('touch cancel invokes onCancel (not onUp)', () => {
    const prevOntouchstart = (window as Window & { ontouchstart?: unknown }).ontouchstart;
    (window as Window & { ontouchstart?: unknown }).ontouchstart = (() => {}) as (
      this: GlobalEventHandlers,
      ev: TouchEvent,
    ) => unknown;

    const upCalls: string[] = [];
    const cancelCalls: string[] = [];
    const { result, unmount } = renderHook(() =>
      usePointer({
        onUp: (e) => upCalls.push(e.type),
        onCancel: (e) => cancelCalls.push(e.type),
      }),
    );

    try {
      const handlers = result.current.handlers as {
        onTouchStart: React.TouchEventHandler;
        onTouchCancel: React.TouchEventHandler;
      };

      act(() => handlers.onTouchStart(fakeTouchEvent('touchstart', { x: 1, y: 1 })));
      act(() => handlers.onTouchCancel(fakeTouchEvent('touchcancel', { x: 2, y: 2 })));

      expect(upCalls).to.eql([]);
      expect(cancelCalls).to.eql(['touchcancel']);
    } finally {
      unmount();
      (window as Window & { ontouchstart?: unknown }).ontouchstart = prevOntouchstart;
    }
  });
});

function fakePointerTarget(args: { hasCapture: boolean }) {
  const calls = { set: 0, release: 0 };
  return {
    calls,
    setPointerCapture() {
      calls.set += 1;
    },
    releasePointerCapture() {
      calls.release += 1;
    },
    hasPointerCapture() {
      return args.hasCapture;
    },
  };
}

function fakePointerEvent(
  type: string,
  currentTarget: {
    setPointerCapture(pointerId: number): void;
    releasePointerCapture(pointerId: number): void;
    hasPointerCapture(pointerId: number): boolean;
  },
): React.PointerEvent {
  return {
    type,
    pointerId: 1,
    clientX: 10,
    clientY: 20,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    currentTarget,
    preventDefault() {},
    stopPropagation() {},
  } as React.PointerEvent;
}

function fakeTouchEvent(type: string, point: { x: number; y: number }): React.TouchEvent {
  const touch = {
    clientX: point.x,
    clientY: point.y,
    screenX: point.x,
    screenY: point.y,
  };

  return {
    type,
    touches: [touch] as unknown as TouchList,
    changedTouches: [touch] as unknown as TouchList,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    preventDefault() {},
    stopPropagation() {},
  } as unknown as React.TouchEvent;
}
