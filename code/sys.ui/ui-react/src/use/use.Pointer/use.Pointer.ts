import React, { useCallback, useEffect, useRef, useState } from 'react';

import { type t, Is, Kbd } from './common.ts';
import { usePointerDrag } from './use.Pointer.Drag.ts';
import { usePointerDragdrop } from './use.Pointer.Dragdrop.ts';

type PointerPhase = 'Idle' | 'Pressed';

type PointerMachineState = {
  readonly phase: PointerPhase;
  readonly suppressLostCapture: boolean;
};

type PointerMachineEvent =
  | { type: 'down'; captured: boolean }
  | { type: 'up' }
  | { type: 'cancel' }
  | { type: 'lostcapture' }
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
  readonly set?: (pointerId: number) => void;
  readonly has?: (pointerId: number) => boolean;
  readonly release?: (pointerId: number) => void;
};

/**
 * Hook: pointer events + optional file drag/drop.
 */
export const usePointer: t.UsePointer = (input) => {
  const args = wrangle.args(input);
  const { onDrag, onDragdrop, dropGuard } = args;
  const captureEnabled = args.capture ?? true;

  const [isDown, setDown] = useState(false);
  const downRef = useRef(false);
  const didCaptureRef = useRef(false);
  const [isOver, setOver] = useState(false);
  const [isFocused, setFocused] = React.useState(false);

  const machineRef = useRef<PointerMachineState>(machine.initial());

  const drag = usePointerDrag({ onDrag });
  const dragdrop = usePointerDragdrop({ onDragdrop, dropGuard });

  const flags = useCallback(
    (patch: Partial<t.PointerHookFlags> = {}) => {
      const down = patch.down ?? isDown;
      return {
        over: patch.over ?? isOver,
        down,
        up: !down,
        dragging: drag.is.dragging,
        dragdropping: dragdrop.is.dragging,
        focused: isFocused,
      };
    },
    [isDown, isOver, drag.is.dragging, dragdrop.is.dragging, isFocused],
  );

  useEffect(() => {
    if (!drag.is.dragging) {
      machineRef.current = machine.reset(machineRef.current);
      downRef.current = false;
      didCaptureRef.current = false;
      setDown(false);
      drag.cancel();
      dragdrop.cancel();
    }
  }, [drag.is.dragging]);

  const toEvent = (synthetic: t.PointerSyntheticEvent): t.PointerEvent => {
    const point = wrangle.clientPoint(synthetic);
    return {
      type: synthetic.type,
      synthetic,
      client: point,
      modifiers: {
        shift: synthetic.shiftKey,
        ctrl: synthetic.ctrlKey,
        alt: synthetic.altKey,
        meta: synthetic.metaKey,
      },
      preventDefault: synthetic.preventDefault.bind(synthetic),
      stopPropagation: synthetic.stopPropagation.bind(synthetic),
      cancel() {
        synthetic.preventDefault();
        synthetic.stopPropagation();
      },
    };
  };

  const fireAggregate = (
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
    if (!value) didCaptureRef.current = false;
    setDown(value);
  };

  const runEffects = (
    effects: readonly PointerMachineEffect[],
    synthetic: t.PointerSyntheticEvent,
    capability?: PointerCaptureCapability,
  ) => {
    if (effects.length === 0) return;
    const trigger = toEvent(synthetic);

    effects.forEach((effect) => {
      if (effect === 'capture:set') {
        if (!wrangle.isPointerEvent(synthetic)) return;
        const set = capability?.set;
        if (!set) {
          didCaptureRef.current = false;
          return;
        }

        try {
          set(synthetic.pointerId);
          didCaptureRef.current = true;
        } catch {
          didCaptureRef.current = false;
        }
        return;
      }

      if (effect === 'capture:release') {
        if (!wrangle.isPointerEvent(synthetic)) return;
        if (!didCaptureRef.current) return;
        const has = capability?.has;
        const release = capability?.release;
        if (!has || !release) return;
        try {
          if (has(synthetic.pointerId)) release(synthetic.pointerId);
        } catch {
          // Ignore capture release failures; lifecycle must still complete.
        } finally {
          didCaptureRef.current = false;
        }
        return;
      }

      if (effect === 'down') {
        applyDown(true);
        args.onDown?.(trigger);
        if (drag.active) drag.start();
        fireAggregate(synthetic, trigger, { down: true });
        return;
      }

      if (effect === 'up') {
        applyDown(false);
        args.onUp?.(trigger);
        drag.cancel();
        fireAggregate(synthetic, trigger, { down: false });
        return;
      }

      if (effect === 'cancel') {
        applyDown(false);
        args.onCancel?.(trigger);
        drag.cancel();
        fireAggregate(synthetic, trigger, { down: false });
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

  const over = (inside: boolean) => (synthetic: t.PointerSyntheticEvent) => {
    const trigger = toEvent(synthetic);
    setOver(inside);
    inside ? args.onEnter?.(trigger) : args.onLeave?.(trigger);
    fireAggregate(synthetic, trigger, { over: inside, down: downRef.current });
  };

  const onPointerDown: React.PointerEventHandler = (e) => {
    const capability = wrangle.capability(e.currentTarget);
    dispatch({ type: 'down', captured: captureEnabled && capability.canSet }, e, capability);
  };

  const onPointerUp: React.PointerEventHandler = (e) => {
    const capability = wrangle.capability(e.currentTarget);
    dispatch({ type: 'release:start' });
    try {
      dispatch({ type: 'up' }, e, capability);
    } finally {
      dispatch({ type: 'release:end' });
    }
  };

  const onPointerCancel: React.PointerEventHandler = (e) => {
    const capability = wrangle.capability(e.currentTarget);
    dispatch({ type: 'cancel' }, e, capability);
  };

  const onLostPointerCapture: React.PointerEventHandler = (e) => {
    dispatch({ type: 'lostcapture' }, e);
  };

  const onTouchStart: React.TouchEventHandler = (e) => {
    over(true)(e);
    dispatch({ type: 'down', captured: false }, e);
  };

  const onTouchEnd: React.TouchEventHandler = (e) => {
    dispatch({ type: 'up' }, e);
    over(false)(e);
  };

  const onTouchCancel: React.TouchEventHandler = (e) => {
    dispatch({ type: 'cancel' }, e);
    over(false)(e);
  };

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

  const focusHandlers: t.PointerHookFocusHandlers = {
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  const handlers: t.PointerHookHandlers = {
    ...pointerHandlers,
    ...touchHandlers,
    ...focusHandlers,
    ...dragdrop.handlers,
  };

  return {
    handlers,
    is: flags(),
    drag: drag.pointer,
    dragdrop: dragdrop.pointer,
    reset() {
      machineRef.current = machine.reset(machineRef.current);
      downRef.current = false;
      didCaptureRef.current = false;
      setFocused(false);
      setDown(false);
      setOver(false);
      drag.cancel();
      dragdrop.cancel();
    },
  } as const;
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
      return {
        state: { ...state, phase: 'Pressed' },
        effects: event.captured ? ['capture:set', 'down'] : ['down'],
      };
    }

    if (event.type === 'up') {
      if (state.phase !== 'Pressed') return { state, effects: [] };
      return {
        state: { ...state, phase: 'Idle' },
        effects: ['capture:release', 'up'],
      };
    }

    if (event.type === 'cancel') {
      if (state.phase !== 'Pressed') return { state, effects: [] };
      return {
        state: { ...state, phase: 'Idle' },
        effects: ['capture:release', 'cancel'],
      };
    }

    if (event.type === 'lostcapture') {
      if (state.phase !== 'Pressed') return { state, effects: [] };
      if (state.suppressLostCapture) return { state, effects: [] };
      return {
        state: { ...state, phase: 'Idle' },
        effects: ['cancel'],
      };
    }

    return { state, effects: [] };
  },
} as const;

const wrangle = {
  args(input: unknown): t.PointerHookArgs {
    if (input == null) return {};
    if (typeof input === 'function') return { on: input as t.PointerEventsHandler };
    return input;
  },

  capability(target: unknown): PointerCaptureCapability {
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
      set: canSet
        ? (pointerId: number) => {
            set.call(currentTarget, pointerId);
          }
        : undefined,
      has:
        canHas && canRelease
          ? (pointerId: number) => {
              return has.call(currentTarget, pointerId);
            }
          : undefined,
      release:
        canHas && canRelease
          ? (pointerId: number) => {
              release.call(currentTarget, pointerId);
            }
          : undefined,
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
