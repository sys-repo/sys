import { useRef, useState } from 'react';
import { COLORS, Color, DEFAULTS, DevIcons, FC, Style, TextInput, css, type t } from './common';

type StringOrNil = string | undefined | null;
type ContentInput = StringOrNil | JSX.Element;
type MarginOrNil = t.MarginInput | undefined | null;
type ErrorInput = t.DevTextboxError | boolean | undefined | null;

export type TextboxProps = t.TextInputFocusProps & {
  isEnabled?: boolean;
  label?: ContentInput;
  value?: StringOrNil;
  placeholder?: ContentInput;
  left?: ContentInput | boolean;
  right?: ContentInput | boolean;
  footer?: ContentInput;
  error?: ErrorInput;
  style?: t.CssValue;
  margin?: MarginOrNil;
  onChange?: t.TextInputChangeHandler;
  onEnter?: t.TextInputKeyHandler;
};

const View: React.FC<TextboxProps> = (props) => {
  const isActive = Wrangle.isActive(props);
  const [isFocused, setFocused] = useState(false);
  const inputRef = useRef<t.TextInputRef>(null);

  /**
   * [Handlers]
   */
  const focusTextbox = (e: React.MouseEvent) => {
    e.preventDefault();
    inputRef.current?.focus();
  };

  /**
   * [Render]
   */
  const HEIGHT = 26;
  const errorColor = Wrangle.errorColor(props);
  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      userSelect: 'none',
      color: COLORS.DARK,
      ...Style.toMargins(props.margin),
    }),
    title: css({
      fontSize: 12,
      color: Color.alpha(COLORS.DARK, 0.7),
      marginBottom: 5,
      opacity: isActive ? 1 : 0.4,
    }),
    body: css({
      borderBottom: `solid 1px`,
      borderBottomColor: Wrangle.borderColor(props, isActive, isFocused),
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
    input: css({
      boxSizing: 'border-box',
      paddingLeft: props.left ? 1 : 5,
      paddingRight: props.right ? 1 : 5,
      PaddingY: 3,
      display: 'grid',
      height: HEIGHT,
    }),
    edge: css({
      height: HEIGHT,
      opacity: isActive ? 1 : 0.2,
      display: 'grid',
      placeItems: 'center',
    }),
    footer: css({
      boxSizing: 'border-box',
      marginTop: 4,
      fontSize: 12,
      fontStyle: 'italic',
      color: errorColor ?? Color.alpha(COLORS.DARK, 0.5),
    }),
  };

  const elInput = (
    <div {...styles.input}>
      <TextInput
        ref={inputRef}
        isEnabled={isActive}
        value={Wrangle.value(props)}
        valueStyle={{ fontSize: 13, color: COLORS.DARK }}
        placeholder={Wrangle.placeholder(props)}
        placeholderStyle={{ opacity: 0.2, italic: true }}
        focusOnReady={props.focusOnReady ?? false}
        focusAction={props.focusAction ?? 'Select'}
        spellCheck={false}
        onFocusChange={(e) => setFocused(e.is.focused)}
        onChange={(e) => {
          if (isActive) props.onChange?.(e);
        }}
        onEnter={(e) => {
          if (isActive) props.onEnter?.(e);
        }}
      />
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {props.label && (
        <div {...styles.title} onMouseDown={focusTextbox}>
          {props.label}
        </div>
      )}
      <div {...styles.body}>
        <div {...styles.edge}>{Wrangle.edge(props, 'left', isFocused)}</div>
        {elInput}
        <div {...styles.edge}>{Wrangle.edge(props, 'right', isFocused)}</div>
      </div>
      {props.footer && (
        <div {...styles.footer} onMouseDown={focusTextbox}>
          {props.footer}
        </div>
      )}
    </div>
  );
};

/**
 * [Helpers]
 */

const Wrangle = {
  isActive(props: TextboxProps): boolean {
    const { isEnabled = DEFAULTS.isEnabled } = props;
    if (!isEnabled) return false;
    return true;
  },

  value(props: TextboxProps) {
    return props.value ?? '';
  },

  placeholder(props: TextboxProps) {
    if (props.placeholder === null) return '';
    return props.placeholder ?? DEFAULTS.placeholder;
  },

  error(props: TextboxProps) {
    let error: t.DevTextboxError | undefined = undefined;
    if (props.error === true) error = 'error';
    if (typeof props.error === 'string') error = props.error;

    const isError = error === 'error';
    const isWarning = error === 'warning';

    return {
      error,
      isError,
      isWarning,
    };
  },

  errorColor(props: TextboxProps) {
    const { isError, isWarning } = Wrangle.error(props);
    if (isError) return COLORS.RED;
    if (isWarning) return COLORS.YELLOW;
    return;
  },

  borderColor(props: TextboxProps, isActive: boolean, isFocused: boolean) {
    const errorColor = Wrangle.errorColor(props);
    if (errorColor) return errorColor;
    return isActive && isFocused ? Color.alpha(COLORS.CYAN, 1) : Color.alpha(COLORS.DARK, 0.1);
  },

  edge(props: TextboxProps, edge: keyof Pick<TextboxProps, 'left' | 'right'>, isFocused: boolean) {
    const value = props[edge];
    if (!value) return null;

    if (value === true) {
      const opacity = isFocused ? 1 : 0.3;
      const color = isFocused ? Color.darken(COLORS.CYAN, 2) : COLORS.DARK;
      const style = {
        marginLeft: edge === 'left' ? 4 : 0,
        marginRight: edge === 'right' ? 0 : 4,
      };
      return <DevIcons.Keyboard style={style} color={color} size={20} opacity={opacity} />;
    }

    return value;
  },
};

/**
 * Export
 */
type Fields = {
  DEFAULT: typeof DEFAULTS;
  isActive: typeof Wrangle.isActive;
};
export const Textbox = FC.decorate<TextboxProps, Fields>(
  View,
  { DEFAULT: DEFAULTS, isActive: Wrangle.isActive },
  { displayName: DEFAULTS.displayName },
);
