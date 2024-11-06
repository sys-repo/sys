import type { t } from './common.ts';

/**
 * Ready
 */
export type TextInputReadyHandler = (e: TextInputReadyArgs) => void;
export type TextInputReadyArgs = { ref: t.TextInputRef; input: HTMLInputElement };

/**
 * Label: double-click
 */
export type TextInputLabelDoubleClickHandler = (e: TextInputLabelDoubleClickArgs) => void;
export type TextInputLabelDoubleClickArgs = { target: t.TextInputLabelKind };

/**
 * Change
 */
export type TextInputChangeHandler = (e: t.TextInputChangeArgs) => void;
export type TextInputChangeArgs = {
  readonly from: string;
  readonly to: string;
  readonly is: { max: boolean | null };
  readonly modifierKeys: t.KeyboardModifierFlags;
  readonly selection: t.TextInputSelection;
  readonly diff: t.TextCharDiff[];
};

/**
 * Selection change
 */
export type TextInputSelectHandler = (e: TextInputSelectHandlerArgs) => void;
export type TextInputSelectHandlerArgs = t.TextInputSelection;

/**
 * Keyboard: Keypress
 */
type KeyboardEvent = React.KeyboardEvent<HTMLInputElement>;

export type TextInputKeyHandler = (e: TextInputKeyArgs) => void;
export type TextInputKeyArgs = KeyboardEvent & { modifierKeys: t.KeyboardModifierFlags };

/**
 * Keyboard: Tab
 */
export type TextInputTabHandler = (e: TextInputTabArgs) => void;
export type TextInputTabArgs = {
  readonly modifierKeys: t.KeyboardModifierFlags;
  readonly is: { cancelled: boolean };
  cancel(): void;
};

/**
 * Focus
 */
export type TextInputFocusHandler = (e: TextInputFocusArgs) => void;
export type TextInputFocusArgs = {
  readonly is: { focused: boolean };
  readonly event: React.FocusEvent<HTMLInputElement>;
};
