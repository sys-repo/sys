import React, { useEffect, useRef } from 'react';
import { type t, Color, css, D, DEFAULTS, Is, Style } from './common.ts';

type P = t.TextInputProps;
type C = string | t.Percent;

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
    const synthetic = e;
    const value = e.target.value;
    props.onChange?.({ value, synthetic });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const synthetic = e;
    const value = e.currentTarget.value;
    const { key } = e;
    props.onKeyDown?.({ value, key, synthetic });
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const border = wrangle.border(props, theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      boxSizing: 'border-box',
    }),
    input: css({
      ...Style.toPadding(props.padding ?? D.padding),
      font: 'inherit',
      color: theme.fg,
      background: theme.format(props.background ?? D.background).bg,

      outline: 'none',
      borderRadius: wrangle.borderRadius(props, border.mode),
      borderTop: border.top,
      borderRight: border.right,
      borderBottom: border.bottom,
      borderLeft: border.left,
      ':focus': {
        borderTop: border.focus.top,
        borderRight: border.focus.right,
        borderBottom: border.focus.bottom,
        borderLeft: border.focus.left,
      },
      transition: 'border-color 120ms ease',

      '::placeholder': { color: theme.alpha(0.2).fg },
      ':disabled': { cursor: 'not-allowed', color: theme.alpha(0.35).fg },
    }),
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
        //
        value={value}
        placeholder={placeholder}
        maxLength={props.maxLength}
        //
        disabled={disabled}
        spellCheck={props.spellCheck ?? D.spellCheck}
        //
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  border(props: P, theme: t.ColorTheme) {
    const D = DEFAULTS.border;
    let defaultColor = D.defaultColor;
    let focusColor = D.focusColor;
    let mode = D.mode;

    let prop = props.border;
    if (prop === true) prop = D;

    if (Is.record(prop)) {
      defaultColor = prop.defaultColor ?? D.defaultColor;
      focusColor = prop.focusColor ?? D.focusColor;
      mode = prop.mode ?? D.mode;
    }
    if (prop === false || mode === 'none') {
      mode = 'none';
      focusColor = 0;
      defaultColor = 0;
    }

    const incl = (...modes: t.TextInputBorder['mode'][]) => modes.includes(mode);
    const format = (color: C) => theme.format(color).fg;
    const border = (color: C = 0) => `1px solid ${format(color)}`;

    return {
      mode,
      left: border(incl('outline') ? defaultColor : 0),
      right: border(incl('outline') ? defaultColor : 0),
      top: border(incl('outline') ? defaultColor : 0),
      bottom: border(incl('outline', 'underline') ? defaultColor : undefined),
      focus: {
        left: border(incl('outline') ? focusColor : 0),
        right: border(incl('outline') ? focusColor : 0),
        top: border(incl('outline') ? focusColor : 0),
        bottom: border(incl('outline', 'underline') ? focusColor : undefined),
      },
    } as const;
  },

  borderRadius(props: P, mode: t.TextInputBorder['mode']) {
    const px = props.borderRadius ?? D.borderRadius;
    return mode === 'underline' ? `${px}px ${px}px ${0}px ${0}px` : px;
  },
} as const;
