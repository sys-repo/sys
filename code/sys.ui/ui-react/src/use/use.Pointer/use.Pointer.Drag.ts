import { useEffect, useRef, useState } from 'react';
import { type t } from './common.ts';

const MOVEMENT_THRESHOLD: t.Pixels = 3;
type DragSessionSource = 'Unknown' | 'Mouse' | 'Touch';
type EventLikeWithClient = Event & { clientX: number; clientY: number };
type EventLikeWithTouches = Event & { touches: TouchList; changedTouches: TouchList };

/**
 * Internal hook that tracks low-level mouse/touch movement events (aka. "drag").
 */
export const usePointerDrag: t.UsePointerDrag = (props = {}) => {
  const active = Boolean(props.onDrag);

  /**
   * Refs:
   */
  const startedRef = useRef(false);
  const sessionIdRef = useRef(0);
  const sourceRef = useRef<DragSessionSource>('Unknown');
  const listenersRef = useRef<{
    selectStart?: EventListener;
    mouseMove?: EventListener;
    mouseUp?: EventListener;
    touchMove?: EventListener;
    touchEnd?: EventListener;
    touchCancel?: EventListener;
  }>({});
  const originRef = useRef<t.Point>(undefined); // position at `start` of drag operation.
  const draggingRef = useRef(false);
  const prevTouchRef = useRef<t.Point>(undefined);

  /**
   * Hooks:
   */
  const [pointer, setPointer] = useState<t.PointerDragSnapshot>();
  const [, setDragging] = useState(false);
  const is: t.PointerDragHook['is'] = {
    get dragging() {
      return draggingRef.current;
    },
  };

  /**
   * Effects:
   */
  useEffect(() => cancel, []); // Ensure disposed.

  /**
   * Helpers:
   */
  const ensureOrigin = (p: t.Point) => (originRef.current ??= p);
  const movedEnough = (p: t.Point) => {
    const o = originRef.current!;
    return Math.max(Math.abs(p.x - o.x), Math.abs(p.y - o.y)) >= MOVEMENT_THRESHOLD;
  };
  const promoteIfMoved = (p: t.Point) => {
    ensureOrigin(p);
    if (!draggingRef.current && movedEnough(p)) {
      draggingRef.current = true;
      setDragging(true);
    }
  };

  const isActiveSession = (sessionId: number) => {
    return startedRef.current && sessionIdRef.current === sessionId;
  };

  /**
   * Handlers:
   */
  const registerMove = (e: Event, snapshot: t.PointerSnapshot) => {
    e.preventDefault(); // Prevent page-select/scroll during drag.

    const payload: t.PointerDragSnapshot = { ...snapshot, cancel };
    setPointer(payload);
    props.onDrag?.(payload);
  };

  /**
   * Methods:
   */
  const resetState = () => {
    startedRef.current = false;
    originRef.current = undefined;
    prevTouchRef.current = undefined;
    sourceRef.current = 'Unknown';
    draggingRef.current = false; // ← sync
    setDragging(false); //          ← async
    setPointer(undefined);
  };

  const removeListeners = () => {
    const off = document.removeEventListener;
    const listeners = listenersRef.current;
    if (listeners.selectStart) off('selectstart', listeners.selectStart);
    if (listeners.mouseMove) off('mousemove', listeners.mouseMove);
    if (listeners.mouseUp) off('mouseup', listeners.mouseUp);
    if (listeners.touchMove) off('touchmove', listeners.touchMove);
    if (listeners.touchEnd) off('touchend', listeners.touchEnd);
    if (listeners.touchCancel) off('touchcancel', listeners.touchCancel);
    listenersRef.current = {};
  };

  const start = () => {
    if (startedRef.current) return;

    resetState();
    startedRef.current = true;
    sessionIdRef.current += 1;
    const sessionId = sessionIdRef.current;

    const on = document.addEventListener;
    const onSelectStart: EventListener = (e) => {
      if (!isActiveSession(sessionId)) return;
      e.preventDefault();
    };
    const onMouseMove: EventListener = (event) => {
      if (!active || !isActiveSession(sessionId)) return;
      if (!isMouseLikeEvent(event)) return;
      if (sourceRef.current === 'Touch') return;
      sourceRef.current = 'Mouse';

      const snapshot = toMouseSnapshot(event);
      promoteIfMoved(snapshot.client);
      if (!is.dragging) return;
      registerMove(event, snapshot);
    };
    const onTouchMove: EventListener = (event) => {
      if (!active || !isActiveSession(sessionId)) return;
      if (!isTouchLikeEvent(event)) return;
      if (sourceRef.current === 'Mouse') return;
      sourceRef.current = 'Touch';

      const snapshot = toTouchSnapshot(event, prevTouchRef.current);
      promoteIfMoved(snapshot.client);
      if (!is.dragging) return;
      registerMove(event, snapshot);
      prevTouchRef.current = snapshot.client;
    };
    const onMouseUp: EventListener = () => {
      if (!isActiveSession(sessionId)) return;
      cancel();
    };
    const onTouchEnd: EventListener = () => {
      if (!isActiveSession(sessionId)) return;
      cancel();
    };
    const onTouchCancel: EventListener = () => {
      if (!isActiveSession(sessionId)) return;
      cancel();
    };

    listenersRef.current = {
      selectStart: onSelectStart,
      mouseMove: onMouseMove,
      mouseUp: onMouseUp,
      touchMove: onTouchMove,
      touchEnd: onTouchEnd,
      touchCancel: onTouchCancel,
    };

    on('selectstart', onSelectStart);
    on('mousemove', onMouseMove);
    on('mouseup', onMouseUp);
    on('touchmove', onTouchMove, { passive: false }); // NB: non-passive required for preventDefault.
    on('touchend', onTouchEnd);
    on('touchcancel', onTouchCancel);
  };

  const cancel = () => {
    if (!startedRef.current) return;
    removeListeners();
    resetState();
  };

  /**
   * API:
   */
  const api: t.PointerDragHook = {
    is,
    active,
    pointer,
    start,
    cancel,
  };
  return api;
};

/**
 * Helpers:
 */
export function toMouseSnapshot(e: MouseEvent): t.PointerSnapshot {
  return {
    movement: { x: e.movementX, y: e.movementY },
    client: { x: e.clientX, y: e.clientY },
    screen: { x: e.screenX, y: e.screenY },
    modifiers: toModifiers(e),
    button: e.button,
  };
}

export function toTouchSnapshot(e: TouchEvent, touchPrev?: t.Point): t.PointerSnapshot {
  const touch = e.touches[0] ?? e.changedTouches[0];
  const x = touch?.clientX ?? 0;
  const y = touch?.clientY ?? 0;
  const movement = touchPrev ? { x: x - touchPrev.x, y: y - touchPrev.y } : { x: 0, y: 0 };
  return {
    movement,
    client: { x, y },
    screen: { x: touch?.screenX ?? x, y: touch?.screenY ?? y },
    modifiers: toModifiers(e),
    button: 0, // NB: Touch has no concept of mouse buttons.
  };
}

export function toModifiers(e: TouchEvent | MouseEvent | React.DragEvent): t.KeyboardModifierFlags {
  return {
    shift: e.shiftKey,
    ctrl: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey,
  };
}

function isMouseLikeEvent(event: Event): event is MouseEvent {
  const e = event as Partial<EventLikeWithClient>;
  return typeof e.clientX === 'number' && typeof e.clientY === 'number' && !isTouchLikeEvent(event);
}

function isTouchLikeEvent(event: Event): event is TouchEvent {
  const e = event as Partial<EventLikeWithTouches>;
  return Array.isArray(e.touches) || Array.isArray(e.changedTouches);
}
