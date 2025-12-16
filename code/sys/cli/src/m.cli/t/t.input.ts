import type * as ext from './t.ext.ts';

/**
 * Human input helpers for CLI tools.
 *
 * Stable, opinionated wrappers for requesting input from a user.
 * `Cli.Prompt.*` is available where direct access to prompt primitives is needed.
 */
export type CliInputLib = {
  /** Single free-form text input. */
  readonly Text: {
    readonly prompt: typeof ext.CliffyInput.prompt;
  };

  /** Explicit yes/no decision or consent. */
  readonly Confirm: {
    readonly prompt: typeof ext.CliffyConfirm.prompt;
  };

  /** Numeric value input. */
  readonly Number: {
    readonly prompt: typeof ext.CliffyNumber.prompt;
  };

  /** Hidden or sensitive text input. */
  readonly Secret: {
    readonly prompt: typeof ext.CliffySecret.prompt;
  };

  /** Toggle a boolean state or option. */
  readonly Toggle: {
    readonly prompt: typeof ext.CliffyToggle.prompt;
  };

  /** Repeated free-form text input (one or more values). */
  readonly MultiText: {
    readonly prompt: typeof ext.CliffyList.prompt;
  };

  /** Choose exactly one option from a set. */
  readonly Select: {
    readonly prompt: typeof ext.CliffySelect.prompt;
  };

  /** Choose zero or more options from a set. */
  readonly Checkbox: {
    prompt: typeof ext.CliffyCheckbox.prompt;
  };
};
