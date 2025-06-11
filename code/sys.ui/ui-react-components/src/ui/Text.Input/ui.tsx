import React, { useEffect, useRef } from 'react';
import { type t, Color, css } from './common.ts';

export const TextInput: React.FC<t.TextInputProps> = (props) => {
  const {
    value = '',
    placeholder = '',
    autoFocus = false,
    disabled = false,
    debug = false,
  } = props;

  /**
   * Hooks/Refs:
   */
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Effect: Auto-focus when requested.
   */
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  /**
   * Handlers:
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const synthetic = e;
    props.onChange?.({ value, synthetic });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    const synthetic = e;
    const { key } = e;
    props.onKeyDown?.({ value, key, synthetic });
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      boxSizing: 'border-box',
    }),
    input: css({
    debug: css({
      outline: `1px dashed ${Color.PURPLE}`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <input
        ref={inputRef}
        className={styles.input.class}
        type={'text'}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
