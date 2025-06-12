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
  /** Auto-focus the input on mount. */
  autoFocus?: boolean;
  /** Disable user interaction. */
  disabled?: boolean;
  /** Maximum character length allowed. */
  maxLength?: number;

  spellCheck?: boolean;
  autoCapitalize?: boolean;
  autoCorrect?: boolean;
  autoComplete?: boolean;
  // selectionBackground?: number | string;

  // Appearance:
  padding?: t.CssPaddingInput;
  background?: t.Percent | string;
  border?: Partial<t.TextInputBorder> | boolean;
  borderRadius?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onChange?: t.TextInputHandler;
  onKeyDown?: t.TextInputKeyHandler;
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
export type TextInputHandler = (e: TextInputHandlerArgs) => void;
export type TextInputHandlerArgs = {
  readonly value: string;
  readonly synthetic: React.ChangeEvent<HTMLInputElement>;
};

export type TextInputKeyHandler = (e: TextInputKeyHandlerArgs) => void;
export type TextInputKeyHandlerArgs = {
  readonly value: string;
  readonly key: string;
  readonly synthetic: React.KeyboardEvent<HTMLInputElement>;
};
