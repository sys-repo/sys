import React, { useState } from 'react';
import { type t } from './common.ts';

type H = HTMLInputElement;
type P = t.TextInputProps;

export function useEvents(props: P) {
  const [focused, setFocused] = useState(false);

  /**
   * Handlers:
   */
  const onChange = (e: React.ChangeEvent<H>) => {
    const input = e.currentTarget;
    const value = input.value;
    props.onChange?.({ value, focused, synthetic: e, input });
  };
  const keyHandler = (cb?: t.TextInputKeyHandler) => {
    if (!cb) return;
    return (e: React.KeyboardEvent<H>) => {
      const input = e.currentTarget;
      const value = input.value;
      const { key, code, repeat } = e;
      const modifiers = wrangle.modifiers(e);
      cb({ key, code, modifiers, repeat, value, focused, synthetic: e, input });
    };
  };
  const focusHandler = (focused: boolean, ...cb: (t.TextInputFocusHandler | undefined)[]) => {
    cb = cb.filter(Boolean);
    return (e: React.FocusEvent<H>) => {
      setFocused(focused);
      const input = e.currentTarget;
      const value = input.value;
      const payload: t.TextInputFocusArgs = { value, focused, synthetic: e, input };
      cb.forEach((cb) => cb?.(payload));
    };
  };

  /**
   * API:
   */
  return {
    focused,
    handlers: {
      onChange,
      onKeyDown: keyHandler(props.onKeyDown),
      onKeyUp: keyHandler(props.onKeyUp),
      onFocus: focusHandler(true, props.onFocus, props.onFocusChange),
      onBlur: focusHandler(false, props.onBlur, props.onFocusChange),
    },
  } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  modifiers(e: React.KeyboardEvent<H>): t.KeyboardModifierFlags {
    const { altKey: alt, ctrlKey: ctrl, metaKey: meta, shiftKey: shift } = e;
    return { alt, ctrl, meta, shift };
  },
} as const;
