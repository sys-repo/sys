import { AsyncLocalStorage } from 'node:async_hooks';
import type { t } from '../common.ts';

export type SelectPromptDependency = (
  options: t.CliInput.Select.Options<unknown>,
) => Promise<unknown>;

const scope = new AsyncLocalStorage<SelectPromptDependency>();

/** Return the select-prompt dependency scoped to the current async flow. */
export function selectPromptDependency(): SelectPromptDependency | undefined {
  return scope.getStore();
}

/** Run work with an isolated select-prompt dependency. */
export function withSelectPrompt<T>(dependency: SelectPromptDependency, run: () => T): T {
  return scope.run(dependency, run);
}
