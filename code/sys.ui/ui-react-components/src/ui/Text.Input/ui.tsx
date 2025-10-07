import React, { useEffect, useLayoutEffect, useRef } from 'react';

import { css, D, Style, type t, UserAgent } from './common.ts';
import { useBorderStyles } from './use.BorderStyles.ts';
import { useEvents } from './use.Events.ts';

type H = HTMLInputElement;
type P = t.TextInputProps;
const isFirefox = UserAgent.current.is.firefox;

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
   * Refs:
   */
  const inputRef = useRef<H>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  /**
   * Hooks:
   */
  const events = useEvents(props);
  const { border, borderRadius, theme } = useBorderStyles(props);
  const { focused } = events;

  const [ready, setReady] = React.useState(false);

  /**
   * Effect: When mounted → fire onReady (once).
   */
  useEffect(() => {
    const input = inputRef.current;
    if (ready || !input) return;
    props.onReady?.({ input });
    setReady(true);
  }, [ready, props.onReady, inputRef]);

  /**
   * Effect: Auto-focus when requested.
   */
  useEffect(() => {
    if (!autoFocus) return;
    const input = inputRef.current;
    if (input) {
      const length = input.value.length;
      selectionRef.current = { start: length, end: length };
      input.focus();
      input.setSelectionRange(length, length);
    }
  }, [autoFocus]);

  /**
   * Effect: After each value change, restore the caret.
   *         useLayoutEffect to avoid flicker.
   */
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el || !focused) return;
    const { start, end } = selectionRef.current;
    el.setSelectionRange(start, end);
  }, [value, focused]);

  /**
   * Handlers:
   * Intercept onChange → record caret then delegate to original handler.
   */
  const handleChange = (e: React.ChangeEvent<H>) => {
    const el = e.target as H;
    selectionRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    };
    events.handlers.onChange(e);
  };

  /**
   * Render:
   */
  const height = 30;
  const styles = {
    base: css({
      position: 'relative',
      background: theme.format(props.background ?? D.background).bg,
      color: theme.fg,
      boxSizing: 'border-box',
      height,
      lineHeight: 'normal',
      borderRadius,
      transition: 'border-color 120ms ease',
      ...(focused ? border.focus : border.base),

      display: 'grid',
      gridTemplateColumns: wrangle.columns(props),
      alignItems: 'center',
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

      paddingBlock: 0,
      height: '100%',
      lineHeight: `${height}px`, // NB: caret/text baseline identical in all browsers.
      transform: isFirefox ? 'translateY(0.5px)' : undefined, // FF tweak.

      // Passed in style preferences:
      filter: inputStyle.blur ? `blur(${inputStyle.blur}px)` : undefined,
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
        //
        {...events.handlers}
        onChange={handleChange}
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
