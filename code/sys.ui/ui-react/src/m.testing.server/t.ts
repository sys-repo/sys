import type React from 'react';
import type { t } from './common.ts';

import type { RenderHookOptions, RenderHookResult } from '@testing-library/react';

/**
 * Tools for testing React on the server.
 */
export type TestReactServerLib = {
  readonly render: TestReactRender;
  readonly renderHook: TestReactRenderHook;
  readonly act: TestReactAct;
};

/** Renders an element into the service-side test DOM. */
export type TestReactRender = (
  el: React.ReactNode,
  options?: TestReactRenderOptions,
) => Promise<t.TestReactRendered>;

/** Options passed to the `TestReact.render` method. */
export type TestReactRenderOptions = {
  /** Flag indicating if the element should be contained within the <StrictMode> render container. */
  strict?: boolean;
};

/**
 * A server-rendered react component.
 */
export type TestReactRendered = t.Lifecycle & { readonly container: HTMLDivElement };

/**
 * Allows you the rendering of a hook within a test React component without
 * having to create that component.
 */
export type TestReactRenderHook = <TResult, TProps>(
  callback: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>,
) => Promise<RenderHookResult<TResult, TProps>>;

/**
 * Wrap any code rendering and triggering updates to your components into `act()` calls.
 */
export type TestReactAct = (fn: () => void | Promise<void>) => Promise<void>;
