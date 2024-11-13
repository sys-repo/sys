import type { RefObject } from 'react';
import { Wrangle } from './u.ts';

type ElementFocusHandler = (e: FocusEvent) => void;

export const Focus = {
  args: Wrangle.args,

  /**
   * Determine if the given element contains the focused item.
   */
  containsFocus(ref: RefObject<HTMLElement>) {
    const active = document.activeElement;
    return active && ref.current ? ref.current.contains(active) : false;
  },

  /**
   * Determine if the given element is within the currently focused item.
   */
  withinFocus(ref: RefObject<HTMLElement>) {
    const active = document.activeElement;
    return active && ref.current ? active.contains(ref.current) : false;
  },

  /**
   * Setup a disposable set of focus/blur event handlers./
   */
  listen<H extends HTMLElement = HTMLDivElement>(
    ref: RefObject<H>,
    handlers: { onFocus?: ElementFocusHandler; onBlur?: ElementFocusHandler } = {},
  ) {
    const { onFocus, onBlur } = handlers;
    const el = ref.current;
    if (el) {
      if (onFocus) el.addEventListener('focus', onFocus);
      if (onBlur) el.addEventListener('blur', onBlur);
    }
    return {
      dispose() {
        if (!el) return;
        if (onFocus) el.removeEventListener('focus', onFocus);
        if (onBlur) el.removeEventListener('blur', onBlur);
      },
    } as const;
  },
} as const;
