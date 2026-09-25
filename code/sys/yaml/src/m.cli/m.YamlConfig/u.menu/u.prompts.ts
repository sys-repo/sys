import { Cli } from '../common.ts';

/** Menu-owned select options preserve the selected value type. */
export type MenuSelectOptions<T> = {
  readonly message?: string;
  readonly options: { readonly name: string; readonly value: T }[];
  readonly default?: T;
  readonly hideDefault?: boolean;
};

/** Package-internal menu prompt dependencies. */
export type MenuPromptDeps = {
  readonly select: <T>(args: MenuSelectOptions<T>) => Promise<T>;
  readonly text: typeof Cli.Input.Text.prompt;
  readonly confirm: typeof Cli.Input.Confirm.prompt;
};

const DEFAULT_DEPS: MenuPromptDeps = Object.freeze({
  select<T>(args: MenuSelectOptions<T>): Promise<T> {
    // Cliffy widens literal prompt values in its declaration but returns the selected option value.
    return Cli.Input.Select.prompt(args) as Promise<T>;
  },
  text: Cli.Input.Text.prompt,
  confirm: Cli.Input.Confirm.prompt,
});

/** Returns the complete production menu prompt provider. */
export function defaultMenuPrompts(): MenuPromptDeps {
  return DEFAULT_DEPS;
}
