import React, { useEffect, useRef } from 'react';

import { type t, css, D, Style } from './common.ts';
import { useBorderStyles } from './use.BorderStyles.ts';
import { useEvents } from './use.Events.ts';

type H = HTMLInputElement;
type P = t.TextInputProps;

export const TextInput: React.FC<P> = (props) => {
  const {
    value = '',
    placeholder = '',
    autoFocus = D.autoFocus,
    disabled = D.disabled,
    debug = false,
  } = props;

  /**
   * Hooks:
   */
  const inputRef = useRef<H>(null);
  const events = useEvents(props);
  const { border, borderRadius, theme } = useBorderStyles(props);
  const { focused } = events;

  /**
   * Effect: Auto-focus when requested.
   */
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      boxSizing: 'border-box',
      borderRadius,
      transition: 'border-color 120ms ease',
      ...(focused ? border.focus : border.base),
      display: 'grid',
    }),
    input: css({
      ...Style.toPadding(props.padding ?? D.padding),
      font: 'inherit',
      color: theme.fg,
      background: theme.format(props.background ?? D.background).bg,
      borderRadius,
      border: 'none',
      outline: 'none',
      '::placeholder': { color: theme.alpha(0.2).fg },
      ':disabled': { cursor: 'not-allowed', color: theme.alpha(0.35).fg },
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <input
        ref={inputRef}
        className={styles.input.class}
        type={'text'}
        tabIndex={props.tabIndex}
        value={value}
        placeholder={placeholder}
        maxLength={props.maxLength}
        disabled={disabled}
        spellCheck={props.spellCheck ?? D.spellCheck}
        {...events.handlers}
      />
    </div>
  );
};
