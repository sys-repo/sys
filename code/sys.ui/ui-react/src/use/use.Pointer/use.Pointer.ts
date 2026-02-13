import React, { useCallback, useEffect, useRef, useState } from 'react';

import { type t, Is, Kbd } from './common.ts';
import { usePointerDrag } from './use.Pointer.Drag.ts';
import { usePointerDragdrop } from './use.Pointer.Dragdrop.ts';

/**
 * Hook: pointer events + optional file drag/drop.
 * @example:
 *
 *   const pointer = usePointer({ onDrag, onDragdrop });
 *   <div {...pointer.handlers} />
 *
 */
export const usePointer: t.UsePointer = (input) => {
  const args = wrangle.args(input);
  const { onDrag, onDragdrop, dropGuard } = args;

  /**
   * Hooks:
   */
  const [isDown, setDown] = useState(false);
  const downRef = useRef(false);
  const [isOver, setOver] = useState(false);
  const [isFocused, setFocused] = React.useState(false);
  const machineRef = useRef<PointerMachineState>(machine.initial());

  const drag = usePointerDrag({ onDrag });
  const dragdrop = usePointerDragdrop({ onDragdrop, dropGuard });

  const flags = useCallback(
    (patch: Partial<t.PointerHookFlags> = {}) => {
      const down = patch?.down ?? isDown;
      return {
        over: patch?.over ?? isOver,
        down,
        up: !down,
        dragging: drag.is.dragging,
        dragdropping: dragdrop.is.dragging,
        focused: isFocused,
      };
    },
    [isDown, isOver, drag.is.dragging, dragdrop.is.dragging, isFocused],
  );

  /**
   * Effect:
   *    When the low-level drag stops
   *    (ie. mouse-up outside) reset "down".
   *
   */
  useEffect(() => {
    if (!drag.is.dragging) {
      machineRef.current = machine.reset(machineRef.current);
      downRef.current = false;
      setDown(false);
      drag.cancel();
      dragdrop.cancel();
    }
  }, [drag.is.dragging]);

  /**
   * General helpers:
   */
  const fire = (
    synthetic: t.PointerSyntheticEvent,
    trigger: t.PointerEvent,
    patch: Partial<t.PointerHookFlags>,
  ) => {
    args.on?.({
      is: flags(patch),
      synthetic: trigger,
      modifiers: Kbd.modifiers(synthetic),
      preventDefault: () => synthetic.preventDefault(),
      stopPropagation: () => synthetic.stopPropagation(),
      cancel() {
        synthetic.preventDefault();
        synthetic.stopPropagation();
      },
    });
  };

  const applyDown = (value: boolean) => {
    downRef.current = value;
    setDown(value);
  };

  const runEffects = (
    effects: readonly PointerMachineEffect[],
    synthetic: t.PointerSyntheticEvent,
    capability?: PointerCaptureCapability,
  ) => {
    if (effects.length === 0) return;
    const trigger = wrangle.pointerEvent(synthetic);

    effects.forEach((effect) => {
      switch (effect) {
        case 'capture:set': {
          if (!wrangle.isPointerEvent(synthetic)) return;
          capability?.setPointerCapture?.(synthetic.pointerId);
          return;
        }

        case 'capture:release': {
          if (!wrangle.isPointerEvent(synthetic)) return;
          const has = capability?.hasPointerCapture;
          const release = capability?.releasePointerCapture;
          if (!has || !release) return;
          if (has(synthetic.pointerId)) release(synthetic.pointerId);
          return;
        }

        case 'down': {
          applyDown(true);
          args.onDown?.(trigger);
          if (drag.active) drag.start();
          fire(synthetic, trigger, { down: true });
          return;
        }

        case 'up': {
          applyDown(false);
          args.onUp?.(trigger);
          drag.cancel();
          fire(synthetic, trigger, { down: false });
          return;
        }

        case 'cancel': {
          applyDown(false);
          args.onCancel?.(trigger);
          drag.cancel();
          fire(synthetic, trigger, { down: false });
          return;
        }
      }
    });
  };

  const dispatch = (
    event: PointerMachineEvent,
    synthetic?: t.PointerSyntheticEvent,
    capability?: PointerCaptureCapability,
  ) => {
    const transition = machine.transition(machineRef.current, event);
    machineRef.current = transition.state;
    if (!synthetic) return;
    runEffects(transition.effects, synthetic, capability);
  };

  /**
   * Pointer-in / Pointer-out:
   */
  const over = (inside: boolean) => (e: t.PointerSyntheticEvent) => {
    const trigger = wrangle.pointerEvent(e);
    setOver(inside);
    inside ? args.onEnter?.(trigger) : args.onLeave?.(trigger);
    fire(e, trigger, { over: inside, down: downRef.current });
  };

  /**
   * HANDLERS: Pointer:
   */
  const onPointerDown: React.PointerEventHandler = (e) => {
    const capability = wrangle.captureCapability(e.currentTarget);
    dispatch(wrangle.machineEvent.down(e.type, capability.canSet), e, capability);
  };

  const onPointerUp: React.PointerEventHandler = (e) => {
    const capability = wrangle.captureCapability(e.currentTarget);
    dispatch({ type: 'release:start' });
    try {
      dispatch(wrangle.machineEvent.up(e.type), e, capability);
    } finally {
      dispatch({ type: 'release:end' });
    }
  };

  const onPointerCancel: React.PointerEventHandler = (e) => {
    const capability = wrangle.captureCapability(e.currentTarget);
    dispatch(wrangle.machineEvent.cancel(e.type), e, capability);
  };

  const onLostPointerCapture: React.PointerEventHandler = (e) => {
    dispatch({ type: 'lostpointercapture' }, e);
  };

  /**
   * HANDLERS: Touch:
   */
  const onTouchStart: React.TouchEventHandler = (ev) => {
    over(true)(ev);
    dispatch(wrangle.machineEvent.down(ev.type, false), ev);
  };

  const onTouchEnd: React.TouchEventHandler = (ev) => {
    dispatch(wrangle.machineEvent.up(ev.type), ev);
    over(false)(ev);
  };

  const onTouchCancel: React.TouchEventHandler = (ev) => {
    dispatch(wrangle.machineEvent.cancel(ev.type), ev);
    over(false)(ev);
  };

  /**
   * HANDLERS: Focus:
   */
  const focused = (value: boolean): React.FormEventHandler => () => setFocused(value);

  /**
   * Combine handlers:
   */
  const pointerHandlers: t.PointerHookMouseHandlers = {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onPointerEnter: over(true),
    onPointerLeave: over(false),
  };

  const touchHandlers: t.PointerHookTouchHandlers = {
    onTouchStart,
    onTouchEnd,
    onTouchCancel,
  };

  const focusHanders: t.PointerHookFocusHandlers = {
    onFocus: focused(true),
    onBlur: focused(false),
  };

  const handlers: t.PointerHookHandlers = {
    ...pointerHandlers,
    ...touchHandlers,
    ...focusHanders,
    ...dragdrop.handlers,
  };

  /**
   * API:
   */
  return {
    handlers,
    is: flags(),
    drag: drag.pointer,
    dragdrop: dragdrop.pointer,
    reset() {
      machineRef.current = machine.reset(machineRef.current);
      downRef.current = false;
      setFocused(false);
      setDown(false);
      setOver(false);
      drag.cancel();
      dragdrop.cancel();
    },
  } as const;
};

type PointerMachineState = {
  readonly phase: 'Idle' | 'Pressed' | 'PressedCaptured';
  readonly suppressLostCapture: boolean;
};

type PointerMachineEvent =
  | { type: 'down'; source: string; captured: boolean }
  | { type: 'up'; source: string }
  | { type: 'cancel'; source: string }
  | { type: 'lostpointercapture' }
  | { type: 'release:start' }
  | { type: 'release:end' };

type PointerMachineEffect = 'capture:set' | 'capture:release' | 'down' | 'up' | 'cancel';

type PointerMachineTransition = {
  readonly state: PointerMachineState;
  readonly effects: readonly PointerMachineEffect[];
};

type PointerCaptureCapability = {
  readonly canSet: boolean;
  readonly canHas: boolean;
  readonly canRelease: boolean;
  readonly setPointerCapture?: (pointerId: number) => void;
  readonly hasPointerCapture?: (pointerId: number) => boolean;
  readonly releasePointerCapture?: (pointerId: number) => void;
};

const machine = {
  initial(): PointerMachineState {
    return { phase: 'Idle', suppressLostCapture: false };
  },

  reset(state: PointerMachineState): PointerMachineState {
    if (state.phase === 'Idle' && !state.suppressLostCapture) return state;
    return { phase: 'Idle', suppressLostCapture: false };
  },

  transition(state: PointerMachineState, event: PointerMachineEvent): PointerMachineTransition {
    if (event.type === 'release:start') {
      if (state.suppressLostCapture) return { state, effects: [] };
      return { state: { ...state, suppressLostCapture: true }, effects: [] };
    }

    if (event.type === 'release:end') {
      if (!state.suppressLostCapture) return { state, effects: [] };
      return { state: { ...state, suppressLostCapture: false }, effects: [] };
    }

    if (event.type === 'down') {
      if (state.phase !== 'Idle') return { state, effects: [] };
      const phase = event.captured ? 'PressedCaptured' : 'Pressed';
      const effects: PointerMachineEffect[] = event.captured ? ['capture:set', 'down'] : ['down'];
      return { state: { ...state, phase }, effects };
    }

    if (event.type === 'up') {
      if (state.phase === 'Idle') return { state, effects: [] };
      return {
        state: { ...state, phase: 'Idle' },
        effects: ['capture:release', 'up'],
      };
    }

    if (event.type === 'cancel') {
      if (state.phase === 'Idle') return { state, effects: [] };
      return {
        state: { ...state, phase: 'Idle' },
        effects: ['capture:release', 'cancel'],
      };
    }

    if (event.type === 'lostpointercapture') {
      if (state.phase === 'Idle') return { state, effects: [] };
      if (state.suppressLostCapture) return { state, effects: [] };
      return {
        state: { ...state, phase: 'Idle' },
        effects: ['cancel'],
      };
    }

    return { state, effects: [] };
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  args(input: unknown): t.PointerHookArgs {
    if (input == null) return {};
    if (typeof input === 'function') return { on: input as t.PointerEventsHandler };
    return input;
  },

  machineEvent: {
    down(source: string, captured: boolean): PointerMachineEvent {
      return { type: 'down', source, captured };
    },

    up(source: string): PointerMachineEvent {
      return { type: 'up', source };
    },

    cancel(source: string): PointerMachineEvent {
      return { type: 'cancel', source };
    },
  },

  captureCapability(target: unknown): PointerCaptureCapability {
    const currentTarget = target as {
      setPointerCapture?: unknown;
      hasPointerCapture?: unknown;
      releasePointerCapture?: unknown;
    };

    const set = currentTarget.setPointerCapture;
    const has = currentTarget.hasPointerCapture;
    const release = currentTarget.releasePointerCapture;

    const canSet = Is.func(set);
    const canHas = Is.func(has);
    const canRelease = Is.func(release);

    return {
      canSet,
      canHas,
      canRelease,
      setPointerCapture: canSet
        ? (pointerId: number) => {
            set.call(currentTarget, pointerId);
          }
        : undefined,
      hasPointerCapture:
        canHas && canRelease
          ? (pointerId: number) => {
              return has.call(currentTarget, pointerId);
            }
          : undefined,
      releasePointerCapture:
        canHas && canRelease
          ? (pointerId: number) => {
              release.call(currentTarget, pointerId);
            }
          : undefined,
    };
  },

  pointerEvent(e: t.PointerSyntheticEvent): t.PointerEvent {
    const point = wrangle.clientPoint(e);
    return {
      type: e.type,
      synthetic: e,
      client: point,
      modifiers: {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
      },
      preventDefault: e.preventDefault.bind(e),
      stopPropagation: e.stopPropagation.bind(e),
      cancel() {
        e.preventDefault();
        e.stopPropagation();
      },
    };
  },

  clientPoint(e: t.PointerSyntheticEvent): t.Point {
    if (wrangle.isTouchEvent(e)) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      return { x: touch?.clientX ?? -1, y: touch?.clientY ?? -1 };
    }

    return { x: e.clientX ?? -1, y: e.clientY ?? -1 };
  },

  isTouchEvent(e: t.PointerSyntheticEvent): e is React.TouchEvent {
    return 'changedTouches' in e;
  },

  isPointerEvent(e: t.PointerSyntheticEvent): e is React.PointerEvent {
    return 'pointerId' in e;
  },
} as const;
