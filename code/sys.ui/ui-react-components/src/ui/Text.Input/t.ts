import type { t } from './common.ts';

type Color = string | t.Percent;

/**
 * <Component>:
 */
export type TextInputProps = {
  debug?: boolean;

  /** Current input value (controlled pattern). */
  value?: string;
  /** Placeholder text shown when value is empty. */
  placeholder?: string;
  /** Auto-focus the input on mount (pass incrementing number to re-apply focus over time). */
  autoFocus?: boolean | number;
  /** Disable user interaction. */
  disabled?: boolean;
  /** Supress user input (without fully disabling the input). */
  readOnly?: boolean;
  /** Maximum character length allowed. */
  maxLength?: number;
  /** Controls keyboard focus order in the tab sequence. */
  tabIndex?: number;
  /** Element to render before the textbox (left). */
  prefix?: JSX.Element | false;
  /** Element to render after the textbox (right). */
  suffix?: JSX.Element | false;

  // Flags:
  spellCheck?: boolean;
  autoCapitalize?: boolean;
  autoCorrect?: boolean;
  autoComplete?: boolean;

  /**
   * Appearance:
   */
  padding?: t.CssPaddingInput;
  background?: t.Percent | string;
  border?: Partial<t.TextInputBorder> | boolean;
  borderRadius?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  /**
   * Handlers:
   */
  /** Fires when the textbox is mounted and ready. */
  onReady?: TextInputReadyHandler;
  /** Fires when the textbox value changes. */
  onChange?: t.TextInputChangeHandler;
  /** Fires on key presses within the textbox. */
  onKeyDown?: t.TextInputKeyHandler;
  onKeyUp?: t.TextInputKeyHandler;

  /** Fires on focus or blur of the text. */
  onFocusChange?: t.TextInputFocusHandler;
  /** Fires when the textbox receives focus. */
  onFocus?: t.TextInputFocusHandler;
  /** Fires when the textbox loses focus. */
  onBlur?: t.TextInputFocusHandler;
};

/**
 * Border configuration for a textbox input.
 */
export type TextInputBorder = {
  mode: 'underline' | 'outline' | 'none';
  defaultColor: Color;
  focusColor: Color;
};

/**
 * Events:
 */
type BaseArgs<E> = {
  readonly synthetic: E;
  readonly value: string;
  readonly focused: boolean;
};

/** General change events. */
export type TextInputChangeHandler = (e: TextInputChangeArgs) => void;
export type TextInputChangeArgs = BaseArgs<React.ChangeEvent<HTMLInputElement>>;

/** Focus events. */
export type TextInputFocusHandler = (e: TextInputFocusArgs) => void;
export type TextInputFocusArgs = BaseArgs<React.FocusEvent<HTMLInputElement>>;

/** Keyboard events. */
export type TextInputKeyHandler = (e: TextInputKeyArgs) => void;
export type TextInputKeyArgs = BaseArgs<React.KeyboardEvent<HTMLInputElement>> & {
  readonly key: string; //  ← HINT: typically use this one over `code`.
  readonly code: string;
  readonly modifiers: t.KeyboardModifierFlags;
  readonly repeat: boolean;
};

/** Fires when the textbox is mounted and ready. */
export type TextInputReadyHandler = (e: TextInputReadyArgs) => void;
export type TextInputReadyArgs = {
  readonly input: HTMLInputElement;
};
