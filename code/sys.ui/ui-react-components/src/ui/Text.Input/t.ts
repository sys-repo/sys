import type { t } from './common.ts';

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

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onChange?: t.TextInputHandler;
  onKeyDown?: t.TextInputKeyHandler;
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
