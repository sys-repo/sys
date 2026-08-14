import type { MenuPromptDeps, MenuSelectOptions } from '../u/u.menu.prompts.ts';

/** Creates a complete, fail-closed menu prompt provider for tests. */
export function menuPromptDeps(overrides: Partial<MenuPromptDeps>): MenuPromptDeps {
  return {
    select<T>(): Promise<T> {
      return Promise.reject(new Error('Unexpected menu Select prompt.'));
    },
    text: () => Promise.reject(new Error('Unexpected menu Text prompt.')),
    confirm: () => Promise.reject(new Error('Unexpected menu Confirm prompt.')),
    ...overrides,
  };
}

/** Selects a configured menu option by its value. */
export function selectValue<T>(args: MenuSelectOptions<T>, value: unknown): Promise<T> {
  const option = args.options.find((item) => item.value === value);
  if (!option) throw new Error(`Missing menu option value: ${String(value)}`);
  return Promise.resolve(option.value);
}

/** Selects a configured menu option by its rendered name. */
export function selectName<T>(args: MenuSelectOptions<T>, name: string): Promise<T> {
  const option = args.options.find((item) => item.name === name);
  if (!option) throw new Error(`Missing menu option name: ${name}`);
  return Promise.resolve(option.value);
}
