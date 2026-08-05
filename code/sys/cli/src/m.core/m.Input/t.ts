import type * as ext from '../t.ext.ts';
import type { MenuResultKind } from './t.menu.ts';

/**
 * Human input helpers for CLI tools.
 *
 * Stable, opinionated wrappers for requesting input from a user.
 * `Cli.Prompt.*` is available where direct access to prompt primitives is needed.
 */
export declare namespace CliInput {
  /**
   * Human input helper library contract.
   */
  export type Lib = {
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
      readonly prompt: Select.Prompt;
    };

    /** Choose zero or more options from a set. */
    readonly Checkbox: {
      prompt: typeof ext.CliffyCheckbox.prompt;
    };
  };

  /**
   * Single-selection prompt types.
   */
  export namespace Select {
    /**
     * Options for selecting one value.
     * Omit `message` to render without a title. Other options retain Cliffy semantics.
     */
    export type Options<TValue> = Omit<ext.CliffySelectOptions<TValue>, 'message'> & {
      /** Prompt title. Omit or pass `''` for none. */
      message?: string;
    };

    /** Single-selection prompt. */
    export type Prompt = <TValue>(
      options: Options<TValue>,
    ) => ReturnType<typeof ext.CliffySelect.prompt<TValue>>;
  }

  /**
   * Menu interaction result types.
   */
  export namespace Menu {
    /** Discrete menu interaction outcome. */
    export type ResultKind = (typeof MenuResultKind)[keyof typeof MenuResultKind];

    /** Result returned from a menu handler. */
    export type Result =
      | {
        /** Structured menu result discriminant. */
        readonly kind: ResultKind;
      }
      | ResultKind
      | undefined;
  }
}
