import type * as ext from './t.ext.ts';

/**
 * Index of input prompts.
 */
export type CliPromptLib = {
  /**
   * Text input prompt (String).
   */
  readonly Input: typeof ext.CliffyInput;

  /**
   * Yes/No confirmation input prompt (Boolean).
   */
  readonly Confirm: typeof ext.CliffyConfirm;

  /**
   * Numeric input prompt (Number).
   */
  readonly Number: typeof ext.CliffyNumber;

  /**
   * Secret input prompt (String).
   */
  readonly Secret: typeof ext.CliffySecret;

  /**
   * Yes/No toggle input prompt (Boolean).
   */
  readonly Toggle: typeof ext.CliffyToggle;

  /**
   * List input prompt.
   */
  readonly List: typeof ext.CliffyList;

  /**
   * Selection list input prompt.
   */
  readonly Select: typeof ext.CliffySelect;

  /**
   * Multi-select list input prompt.
   */
  readonly Checkbox: typeof ext.CliffyCheckbox;
};
