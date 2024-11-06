import { useEffect } from 'react';
import { DEFAULTS, Keyboard, rx, type t } from './common.ts';

export type ArrowKey = 'Up' | 'Down';
export type ArrowKeyHandler = (e: ArrowKeyHandlerArgs) => void;
export type ArrowKeyHandlerArgs = { key: ArrowKey; meta: boolean };

/**
 * Keyboard shortcuts.
 */
export function useKeyboard(
  textbox?: t.TextInputRef,
  options: {
    enabled?: boolean;
    autoGrabFocus?: boolean;
    onArrowKey?: ArrowKeyHandler;
    onClear?: () => void;
  } = {},
) {
  const { enabled = true, autoGrabFocus = DEFAULTS.autoGrabFocus } = options;

  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    const isFocused = () => !!textbox?.current.focused;

    const arrowKey = (e: t.KeyMatchSubscriberHandlerArgs, key: ArrowKey) => {
      if (!autoGrabFocus && !isFocused()) return;
      e.handled();
      const meta = e.state.modifiers.meta;
      options.onArrowKey?.({ key, meta });
    };

    const handlers = Keyboard.until(dispose$).on({
      ['Escape']: (e) => textbox?.blur(),
      ['CMD + KeyJ'](e) {
        e.handled();
        textbox?.focus();
        textbox?.selectAll();
      },

      ['CMD + KeyK'](e) {
        e.handled();
        options.onClear?.();
        textbox?.focus();
      },

      ['ArrowUp']: (e) => arrowKey(e, 'Up'),
      ['ArrowDown']: (e) => arrowKey(e, 'Down'),
      ['CMD + ArrowUp']: (e) => arrowKey(e, 'Up'),
      ['CMD + ArrowDown']: (e) => arrowKey(e, 'Down'),
    });

    const keypress = Keyboard.until(dispose$);
    keypress.down$
      .pipe(
        rx.filter(() => enabled && autoGrabFocus),
        rx.filter((e) => !!(e.last?.is.letter || e.last?.is.number)),
      )
      .subscribe(() => textbox?.focus());

    if (!enabled) handlers.dispose();
    return dispose;
  }, [textbox, enabled, autoGrabFocus]);
}
