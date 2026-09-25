import type { t } from './common.ts';

const DEFAULTS: MouseEventInit = {
  bubbles: true,
  cancelable: true,
  button: 0,
};

/**
 * Helpers for testing mouse events in unit-tests.
 */
export const Mouse: t.DomMock.Mouse.Lib = Object.freeze({
  event(type, init) {
    return new globalThis.window.MouseEvent(type, wrangle.init(init));
  },

  fire(el, type, init) {
    const event = Mouse.event(type, init);
    const dispatched = el.dispatchEvent(event);
    return { event, dispatched };
  },

  down(el, init) {
    return Mouse.fire(el, 'mousedown', init);
  },

  up(el, init) {
    return Mouse.fire(el, 'mouseup', init);
  },

  click(el, init) {
    return Mouse.fire(el, 'click', init);
  },

  activate(el, init) {
    return {
      down: Mouse.down(el, init),
      up: Mouse.up(el, init),
    };
  },
});

/**
 * Helpers:
 */
const wrangle = {
  init(input?: MouseEventInit): MouseEventInit {
    return { ...DEFAULTS, ...input };
  },
} as const;
