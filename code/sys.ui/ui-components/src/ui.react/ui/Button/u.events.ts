import type React from 'react';
import { D, Dom, type t } from './common.ts';
import { Wrangle } from './u.ts';

type P = t.Button.Props;
type S = [boolean, (next: boolean) => void];

/** Press eligibility survives redraws and is independent of visual overrides. */
export type PressState = {
  mouse: boolean;
  touch?: number;
  touchEnabled?: boolean;
  key?: 'Enter' | ' ';
};

/** Render-local props and physical state, with a persistent press session. */
export type EventState = {
  readonly props: P;
  readonly press: PressState;
  over: boolean;
  down: boolean;
  keyboardDown: boolean;
};

export function toEventState(
  props: P,
  over: S,
  down: S,
  keyboardDown: S,
  press: PressState,
): EventState {
  return {
    props,
    press,
    get over() {
      return over[0];
    },
    set over(value) {
      over[1](value);
    },
    get down() {
      return down[0];
    },
    set down(value) {
      down[1](value);
    },
    get keyboardDown() {
      return keyboardDown[0];
    },
    set keyboardDown(value) {
      keyboardDown[1](value);
    },
  };
}

/** Mouse callbacks retain their release-time activation contract. */
const Desktop = {
  over(state: EventState, isOver: boolean): React.MouseEventHandler<HTMLElement> {
    return (e) => {
      if (!wrangle.active(state) || wrangle.fromTouch(e)) return;
      state.over = isOver;
      if (!isOver) {
        state.press.mouse = false;
        state.down = false;
      }
      if (Wrangle.enabled(state.props)) {
        if (isOver) state.props.onMouseEnter?.(e);
        else state.props.onMouseLeave?.(e);
      }
      wrangle.mouse(state, e, isOver ? 'MouseEnter' : 'MouseLeave', isOver, isOver && state.down);
    };
  },

  down(state: EventState, isDown: boolean): React.MouseEventHandler<HTMLElement> {
    return (e) => {
      if (!wrangle.active(state) || wrangle.fromTouch(e) || wrangle.fromChild(e)) return;
      const enabled = Wrangle.enabled(state.props);
      const activate = !isDown && state.press.mouse && e.button === 0;
      state.press.mouse = isDown && enabled && e.button === 0 && !e.defaultPrevented;
      state.down = isDown;
      if (enabled) {
        if (isDown) state.props.onMouseDown?.(e);
        else state.props.onMouseUp?.(e);
      }
      // Rollup cancellation must be observed before activating, not afterward.
      wrangle.mouse(state, e, isDown ? 'MouseDown' : 'MouseUp', state.over, isDown);
      if (e.defaultPrevented) state.press.mouse = false;
      if (activate && wrangle.available(state) && !e.defaultPrevented) state.props.onClick?.(e);
    };
  },
} as const;

/** Touch callbacks keep their existing mouse-shaped event adapter. */
const Mobile = {
  start(state: EventState): React.TouchEventHandler<HTMLElement> {
    return (e) => {
      if (!wrangle.active(state) || wrangle.fromChild(e)) return;
      if (e.touches.length !== 1 || state.press.touch !== undefined) {
        Mobile.cancel(state);
        return;
      }
      const touch = e.changedTouches[0];
      if (!touch) return;
      state.press.touch = touch.identifier;
      state.press.touchEnabled = wrangle.available(state) && !e.defaultPrevented;
      state.down = true;
      const synthetic = wrangle.asMouseEvent(e, touch, true);
      if (Wrangle.enabled(state.props)) state.props.onMouseDown?.(synthetic);
      wrangle.mouse(state, synthetic, 'MouseDown', true, true);
      if (e.defaultPrevented) state.press.touchEnabled = false;
    };
  },

  end(state: EventState): React.TouchEventHandler<HTMLElement> {
    return (e) => {
      if (wrangle.fromChild(e)) return;
      const touch = wrangle.touch(e, state.press.touch);
      if (!touch) {
        // A canceled press must not restart as compatibility mouse input.
        e.preventDefault();
        return;
      }
      const activate = state.press.touchEnabled && wrangle.inside(e.currentTarget, touch);
      state.press.touch = undefined;
      state.press.touchEnabled = false;
      state.down = false;
      const synthetic = wrangle.asMouseEvent(e, touch, false);
      try {
        if (!wrangle.active(state)) return;
        if (Wrangle.enabled(state.props)) state.props.onMouseUp?.(synthetic);
        wrangle.mouse(state, synthetic, 'MouseUp', false, false);
        if (activate && wrangle.available(state) && !e.defaultPrevented) {
          e.currentTarget.focus({ preventScroll: true });
          state.props.onClick?.(synthetic);
        }
      } finally {
        // Activation already happened on touchend. Suppress the browser's compatibility
        // mouse sequence rather than guessing a timeout that would block a real mouse.
        e.preventDefault();
      }
    };
  },

  cancel(state: EventState) {
    state.press.touch = undefined;
    state.press.touchEnabled = false;
    state.down = false;
  },

  move(state: EventState): React.TouchEventHandler<HTMLElement> {
    return (e) => {
      const touch = wrangle.touch(e, state.press.touch);
      if (touch && !wrangle.inside(e.currentTarget, touch)) {
        state.press.touchEnabled = false;
        state.down = false;
      }
    };
  },
} as const;

/** Button-local event wiring; native clicks with detail zero cover keyboard and assistive input. */
export const Event = {
  handlers(state: EventState): React.HTMLAttributes<HTMLElement> {
    return {
      onMouseEnter: Desktop.over(state, true),
      onMouseLeave: Desktop.over(state, false),
      onMouseDown: Desktop.down(state, true),
      onMouseUpCapture(e) {
        // Observe child release before its handler can stop propagation; cleanup only.
        if (!wrangle.active(state) || wrangle.fromTouch(e) || !wrangle.fromChild(e)) return;
        state.press.mouse = false;
        state.down = false;
      },
      onMouseUp: Desktop.down(state, false),
      onTouchStart: Mobile.start(state),
      onTouchEnd: Mobile.end(state),
      onTouchMove: Mobile.move(state),
      onTouchCancel: () => Mobile.cancel(state),
      onBlur(e) {
        // Clicking the root can arm a press before focus transfers from a child.
        if (e.target !== e.currentTarget && e.relatedTarget === e.currentTarget) return;
        Event.reset(state);
      },
      onDoubleClick(e) {
        if (
          !wrangle.available(state) || e.defaultPrevented || e.button !== 0 || wrangle.fromChild(e)
        ) return;
        state.props.onDoubleClick?.(e);
      },
      onClick(e) {
        // Pointer activation is owned by release handlers. Do not emit it twice or
        // propagate a second, differently shaped click to ancestors.
        e.stopPropagation();
        if (e.detail !== 0 || e.button !== 0 || e.defaultPrevented) return;
        if (!wrangle.available(state) || wrangle.fromChild(e)) return;
        state.props.onClick?.(e);
      },
      onKeyDown(e) {
        if (!wrangle.keyboard(state, e)) return;
        e.preventDefault();
        if (e.repeat || state.press.key) return;
        state.press.key = e.key === 'Enter' ? 'Enter' : ' ';
        state.keyboardDown = true;
        if (e.key === 'Enter') e.currentTarget.click();
      },
      onKeyUp(e) {
        if (e.target !== e.currentTarget || state.press.key !== e.key) return;
        state.press.key = undefined;
        state.keyboardDown = false;
        if (!wrangle.keyboard(state, e)) return;
        e.preventDefault();
        if (e.key === ' ') e.currentTarget.click();
      },
    };
  },

  reset(state: EventState) {
    state.press.mouse = false;
    state.press.touch = undefined;
    state.press.touchEnabled = false;
    state.press.key = undefined;
    state.down = false;
    state.keyboardDown = false;
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  active: (state: EventState) => state.props.active ?? D.active,
  available: (state: EventState) => wrangle.active(state) && Wrangle.enabled(state.props),

  keyboard(state: EventState, e: React.KeyboardEvent<HTMLElement>) {
    if (
      e.target !== e.currentTarget ||
      e.currentTarget.ownerDocument.activeElement !== e.currentTarget
    ) return false;
    if (e.defaultPrevented || e.nativeEvent.isComposing || e.altKey || e.ctrlKey || e.metaKey) {
      return false;
    }
    return wrangle.available(state) && (e.key === 'Enter' || e.key === ' ');
  },

  fromChild(e: React.SyntheticEvent<HTMLElement>) {
    return e.target !== e.currentTarget &&
      Dom.Interactive.Is.within(e.target, e.currentTarget, { ignore: e.currentTarget });
  },

  fromTouch(e: React.MouseEvent) {
    // Explicit browser interop: this optional capability identifies compatibility mouse input.
    const native = e.nativeEvent as MouseEvent & {
      sourceCapabilities?: { firesTouchEvents?: boolean };
    };
    return native.sourceCapabilities?.firesTouchEvents === true;
  },

  touch(e: React.TouchEvent, identifier?: number) {
    return Array.from(e.changedTouches).find((touch) => touch.identifier === identifier);
  },

  inside(el: HTMLElement, touch: React.Touch) {
    const bounds = el.getBoundingClientRect();
    return touch.clientX >= bounds.left && touch.clientX <= bounds.right &&
      touch.clientY >= bounds.top && touch.clientY <= bounds.bottom;
  },

  asMouseEvent(e: React.TouchEvent, touch: React.Touch, down: boolean): React.MouseEvent {
    // Explicit touch → mouse compatibility boundary; retain working SyntheticEvent methods.
    return {
      ...e,
      button: 0,
      buttons: down ? 1 : 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      isDefaultPrevented: () => e.isDefaultPrevented(),
      isPropagationStopped: () => e.isPropagationStopped(),
    } as unknown as React.MouseEvent;
  },

  mouse(
    state: EventState,
    e: React.MouseEvent,
    action: t.Button.Mouse.Args['action'],
    over: boolean,
    down: boolean,
  ) {
    const enabled = Wrangle.enabled(state.props);
    const { ctrlKey: ctrl, shiftKey: shift, metaKey: meta, altKey: alt } = e;
    state.props.onMouse?.({
      synthetic: e,
      action,
      is: { over, down, enabled, disabled: !enabled },
      modifiers: { ctrl, shift, meta, alt },
      cancel() {
        e.stopPropagation();
        e.preventDefault();
      },
    });
  },
} as const;
