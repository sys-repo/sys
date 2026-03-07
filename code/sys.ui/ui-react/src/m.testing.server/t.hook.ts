import type { RenderHookResult, RenderHookOptions } from '@testing-library/react';

/**
 * Allows you the rendering of a hook within a test React component without
 * having to create that component.
 *
 * NOTE: sync surface (matches @testing-library/react).
 */
export type TestReactRenderHook = <TResult, TProps>(
  callback: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>,
) => RenderHookResult<TResult, TProps>;

/**
 * Wrap any code rendering and triggering updates to your components into `act()` calls.
 *
 * NOTE: Keep return type aligned with @testing-library/react's `act`.
 * Callers can still `await act(async () => ...)` where needed.
 */
export type TestReactAct = (fn: () => void | Promise<void>) => unknown;
