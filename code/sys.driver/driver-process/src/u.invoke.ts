import { AsyncLocalStorage } from 'node:async_hooks';
import { Process } from './common.ts';

const scope = new AsyncLocalStorage<typeof Process.invoke>();

/** Invoke through the current package-owned dependency scope. */
export const invoke: typeof Process.invoke = (input) => {
  return (scope.getStore() ?? Process.invoke)(input);
};

/** Run work with an isolated process-invocation dependency. */
export function withInvoke<T>(dependency: typeof Process.invoke, run: () => T): T {
  return scope.run(dependency, run);
}
