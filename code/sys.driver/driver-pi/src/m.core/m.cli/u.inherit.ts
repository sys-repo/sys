import { AsyncLocalStorage } from 'node:async_hooks';
import { Process } from './common.ts';

const scope = new AsyncLocalStorage<typeof Process.inherit>();

/** Launch through the current package-owned process dependency scope. */
export const inherit: typeof Process.inherit = (input) => {
  return (scope.getStore() ?? Process.inherit)(input);
};

/** Run work with an isolated inherited-process dependency. */
export function withInherit<T>(dependency: typeof Process.inherit, run: () => T): T {
  return scope.run(dependency, run);
}
