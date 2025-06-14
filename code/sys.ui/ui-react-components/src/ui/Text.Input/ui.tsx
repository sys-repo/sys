import React, { useEffect, useRef } from 'react';

import { type t, css, D, Style } from './common.ts';
import { useBorderStyles } from './use.BorderStyles.ts';
import { useEvents } from './use.Events.ts';

type H = HTMLInputElement;
type P = t.TextInputProps;

export const TextInput: React.FC<P> = (props) => {
  const {
    debug = false,
    value = '',
    placeholder = '',
    autoFocus = D.autoFocus,
    disabled = D.disabled,
    readOnly = D.readOnly,
    prefix,
    suffix,
    inputStyle = {},
  } = props;

  /**
   * Hooks:
   */
  const inputRef = useRef<H>(null);
  const events = useEvents(props);
  const { border, borderRadius, theme } = useBorderStyles(props);
  const { focused } = events;

  const [ready, setReady] = React.useState(false);

  /**
   * Effect: mounted → ready.
   */
  useEffect(() => {
    const element = inputRef.current;

    if (ready) return;
    if (element) {
      props.onReady?.({ input: element });
      setReady(true);
    }
  }, [inputRef]);

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
      background: theme.format(props.background ?? D.background).bg,
      color: theme.fg,
      boxSizing: 'border-box',
      lineHeight: 'normal',
      borderRadius,
      transition: 'border-color 120ms ease',
      ...(focused ? border.focus : border.base),
      display: 'grid',
      gridTemplateColumns: wrangle.columns(props),
    }),
    edge: css({ display: 'grid' }),
    input: css({
      ...Style.toPadding(props.padding ?? D.padding),
      font: 'inherit',
      color: theme.fg,
      background: 'transparent',
      borderRadius,
      border: 'none',
      outline: 'none',
      '::placeholder': { color: theme.alpha(0.2).fg },
      ':disabled': { color: theme.alpha(0.35).fg },

      // Passed in style preferences:
      opacity: inputStyle.opacity,
      transition: 'opacity 120ms ease',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {prefix && <div className={styles.edge.class}>{prefix}</div>}
      <input
        ref={inputRef}
        className={styles.input.class}
        type={'text'}
        tabIndex={props.tabIndex}
        value={value}
        placeholder={placeholder}
        maxLength={props.maxLength}
        disabled={disabled}
        readOnly={readOnly}
        spellCheck={props.spellCheck ?? D.spellCheck}
        {...events.handlers}
      />
      {suffix && <div className={styles.edge.class}>{suffix}</div>}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  columns(props: P): t.CssProps['gridTemplateColumns'] {
    const { prefix, suffix } = props;
    let res = '';
    if (prefix) res += 'auto';
    res += ' 1fr';
    if (suffix) res += ' auto';
    return res.trim();
  },
} as const;
