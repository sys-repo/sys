import type React from 'react';
import { type t, DEFAULTS as D } from './common.ts';

type P = t.ButtonProps;
type S = [boolean, (next: boolean) => void];

/**
 * An object containing the current state of the button
 * used to pass into handlers.
 */
export type EventState = {
  readonly props: P;
  over: boolean;
  down: boolean;
};

/**
 * EventState Factory:
 */
export function toEventState(props: P, over: S, down: S): EventState {
  return {
    props,
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
  };
}

/**
 * Events for desktop devices.
 */
const Desktop = {
  over(state: EventState, isOver: boolean): React.MouseEventHandler {
    return (e) => {
      const props = wrangle.props(state);
      if (!props.active) return;
      state.over = isOver;
      if (!isOver && state.down) state.down = false;
      if (props.enabled) {
        if (isOver) props.onMouseEnter?.(e);
        if (!isOver) props.onMouseLeave?.(e);
      }

      const isDown = !isOver ? false : state.down;
      const isEnabled = props.enabled;
      const action = isOver ? 'MouseEnter' : 'MouseLeave';
      props.onMouse?.({ event: e, isOver, isDown, isEnabled, action });
    };
  },

  down(state: EventState, isDown: boolean): React.MouseEventHandler {
    return (e) => {
      const props = wrangle.props(state);
      if (!props.active) return;

      state.down = isDown;
      if (props.enabled) {
        if (isDown) props.onMouseDown?.(e);
        if (!isDown) props.onMouseUp?.(e);
        if (!isDown) props.onClick?.(e);
      }

      const isOver = state.over;
      const isEnabled = props.enabled;
      const action = isDown ? 'MouseDown' : 'MouseUp';
      props.onMouse?.({ event: e, isOver, isDown, isEnabled, action });
    };
  },
} as const;

/**
 * Events for mobile devices.
 */
const Mobile = {
  down(state: EventState, isDown: boolean): React.TouchEventHandler {
    return (e: React.TouchEvent) => {
      const props = wrangle.props(state);
      if (!props.active) return;

      state.down = isDown;
      const event = wrangle.asMouseEvent(e);
      if (props.enabled) {
        if (isDown && props.onMouseDown) props.onMouseDown(event);
        if (!isDown && props.onMouseUp) props.onMouseUp(event);
        if (!isDown && props.onClick) props.onClick(event);
      }

      const isEnabled = props.enabled;
      const action = isDown ? 'MouseDown' : 'MouseUp';
      props.onMouse?.({ event, isOver: isDown, isDown, isEnabled, action });
    };
  },
} as const;

/**
 * Event tools:
 */
export const Event = {
  Desktop,
  Mobile,
  handlers(state: EventState, isMobile: boolean) {
    return isMobile
      ? {
          onTouchStart: Event.Mobile.down(state, true),
          onTouchEnd: Event.Mobile.down(state, false),
          onTouchCancel: Event.Mobile.down(state, false),
        }
      : {
          onMouseEnter: Event.Desktop.over(state, true),
          onMouseLeave: Event.Desktop.over(state, false),
          onMouseDown: Event.Desktop.down(state, true),
          onMouseUp: Event.Desktop.down(state, false),
          onClick(e: React.MouseEvent) {
            // NB: "onClick" is sythetically derived from mouse-down/up events
            //     so prevent the native onClick event from confusingly propgating
            //     a different version of "onClick" up in the DOM hierarchy.
            e.stopPropagation();
          },
        };
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  props(state: EventState) {
    const { enabled = D.enabled, active = D.active } = state.props;
    return { ...state.props, enabled, active };
  },

  asMouseEvent(e: React.TouchEvent): React.MouseEvent {
    const touch = e.changedTouches[0];
    return {
      ...e,
      button: 0,
      buttons: 1,
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
      screenX: touch.screenX,
      screenY: touch.screenY,
    } as unknown as React.MouseEvent;
  },
} as const;
