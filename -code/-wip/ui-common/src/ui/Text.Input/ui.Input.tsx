import { useEffect, useRef, type RefObject } from 'react';
import { TextInputRef } from './Ref.ts';
import { Color, DEFAULTS, Diff, KeyboardMonitor, R, css, useFocus, type t } from './common.ts';
import { Util, Wrangle } from './u.ts';

/**
 * Types
 */
export type InputProps = t.TextInputFocusProps &
  t.TextInputEventHandlers &
  t.TextInputValue & {
    bus: t.TextInputBus;
    inputRef: RefObject<HTMLInputElement>;
    className?: string;
    isEnabled?: boolean;
    isPassword?: boolean;
    disabledOpacity?: number;
    theme?: t.CommonTheme;
    style?: t.CssValue;
    valueStyle?: t.TextInputStyle;
    selectionBackground?: number | string;
    spellCheck?: boolean;
    autoCapitalize?: boolean;
    autoCorrect?: boolean;
    autoComplete?: boolean;
    onDoubleClick?: React.MouseEventHandler;
  };

/**
 * Component
 */
export const Input: React.FC<InputProps> = (props) => {
  const { bus, inputRef, value = '', selectionBackground, maxLength } = props;
  const {
    isPassword = DEFAULTS.props.isPassword,
    isEnabled = DEFAULTS.props.isEnabled,
    disabledOpacity = DEFAULTS.props.disabledOpacity,
  } = props;

  const lastChangeFired = useRef(value);
  const ref = TextInputRef(inputRef, bus.$);
  useFocus(inputRef, { redraw: false });

  /**
   * Lifecycle
   */
  useEffect(() => {
    /**
     * NOTE:
     *    The <input> element is an "uncontrolled" component.
     *    This means that the value is not managed by React, so
     *    we update the value manually here when it changes.
     *
     * RATAIONALE:
     *    This is done do preserve the caret/selection position
     *    within the textbox when the value is changed externally
     *    via the [value] prop, which causes problems if there is
     *    an async delay between the [onChange] callback firing
     *    on this textbox and the value being processed and re-sent
     *    down the UI hierarchy to this component.
     */
    const el = inputRef.current;
    if (el) el.value = value;

    if (value !== lastChangeFired.current) {
      // NB: ensure the [onChange] event is fired when the value is changed externally.
      handleChange(lastChangeFired.current, value);
    }
  }, [value]);

  /**
   * Handlers
   */
  type A = t.TextInputKeyEventPayload['action'];
  const fireKeyEvent = (action: A, event: t.TextInputKeyArgs) => {
    bus.fire({
      type: 'sys.TextInput:Key',
      payload: { action, event },
    });
  };

  const handleChange = (from: string, to: string) => {
    const { onChange, maxLength } = props;

    // Derive values.
    to = Util.Value.format(to, maxLength);
    const max = maxLength === undefined ? null : to.length === maxLength;
    const is = { max };

    lastChangeFired.current = to;
    if (from === to) return; // NB: not changed.

    // Update state and alert listeners.
    const modifierKeys = cloneModifierKeys();
    const selection = Wrangle.selection(inputRef.current);
    const payload: t.TextInputChangeArgs = {
      from,
      to,
      is,
      modifierKeys,
      selection,
      get diff() {
        return Diff.chars(from, to, { ignoreCase: false });
      },
    };
    onChange?.(payload);
    bus.fire({ type: 'sys.TextInput:Change', payload });
  };

  const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const event = toKeyboardEvent(e);

    props.onKeyDown?.(event);
    fireKeyEvent('KeyDown', event);

    if (e.key === 'Escape') {
      props.onEscape?.(event);
      fireKeyEvent('Escape', event);
    }

    if (e.key === 'Tab') {
      let cancelled = false;

      const payload: t.TextInputTabArgs = {
        modifierKeys: cloneModifierKeys(),
        get is() {
          return { cancelled };
        },
        cancel() {
          cancelled = true;
          e.preventDefault();
        },
      };

      props.onTab?.(payload);
      bus.fire({ type: 'sys.TextInput:Tab', payload });
    }
  };

  const handleKeyup = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const event = toKeyboardEvent(e);

    props.onKeyUp?.(event);
    fireKeyEvent('KeyUp', event);

    if (e.key === 'Enter') {
      props.onEnter?.(event);
      fireKeyEvent('Enter', event);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const payload: t.TextInputFocusArgs = { event, is: { focused: false } };
    props.onBlur?.(payload);
    props.onFocusChange?.(payload);
    bus.fire({ type: 'sys.TextInput:Focus', payload });
  };
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const { focusAction } = props;
    if (focusAction === 'Select') ref.selectAll();
    if (focusAction === 'Cursor:Start') ref.caretToStart();
    if (focusAction === 'Cursor:End') ref.caretToEnd();
    const payload: t.TextInputFocusArgs = { event, is: { focused: true } };
    props.onFocus?.(payload);
    props.onFocusChange?.(payload);
    bus.fire({ type: 'sys.TextInput:Focus', payload });
  };

  /**
   * [Utility]
   */
  const toKeyboardEvent = (e: React.KeyboardEvent<HTMLInputElement>): t.TextInputKeyArgs => {
    return {
      ...e,
      modifierKeys: cloneModifierKeys(),
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    };
  };

  /**
   * [Render]
   */
  const styles = {
    base: {
      position: 'relative',
      border: 'none',
      width: '100%',
      lineHeight: 0,
      minHeight: 20,
      outline: 'none',
      background: 'transparent',
      boxSizing: 'border-box',
      opacity: 1,
    } as t.CssValue,
  };

  if (selectionBackground) {
    styles.base = {
      ...styles.base,
      '::selection': { backgroundColor: Color.format(selectionBackground) },
    } as t.CssValue;
  }

  styles.base = R.mergeDeepRight(styles.base, Util.Css.toTextInput(props));
  styles.base = {
    ...styles.base,
    opacity: isEnabled ? 1 : disabledOpacity,
  };

  return (
    <input
      {...css(styles.base, props.style)}
      className={props.className}
      ref={inputRef}
      type={isPassword ? 'password' : 'text'}
      disabled={!isEnabled}
      value={undefined} /* NB: uncontrolled, value handled above in [useEffect] */
      maxLength={maxLength}
      spellCheck={props.spellCheck}
      autoCapitalize={props.autoCapitalize === false ? 'off' : undefined}
      autoCorrect={props.autoCorrect === false ? 'off' : undefined}
      autoComplete={props.autoComplete === false ? 'off' : undefined}
      onChange={(e) => handleChange(value, e.target.value || '')}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeydown}
      onKeyUp={handleKeyup}
      onDoubleClick={props.onDoubleClick}
      onSelect={() => props.onSelect?.(Wrangle.selection(inputRef.current))}
    />
  );
};

/**
 * Helpers
 */
function cloneModifierKeys() {
  return { ...KeyboardMonitor.state.current.modifiers };
}
