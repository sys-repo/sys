import type React from 'react';
import type { t } from './common.ts';

/**
 * Tools for testing React on the server.
 */
export type TestReactServerLib = {
  /** Renders an element into the service-side test DOM. */
  render(el: React.ReactNode, options?: TestReactRenderOptions): Promise<t.TestReactRendered>;
};

/** Options passed to the `TestReact.render` method. */
export type TestReactRenderOptions = {
  /** Flag indicating if the element should be contained within the <StrictMode> render container. */
  strict?: boolean;
};

/**
 * A server-rendered react component.
 */
export type TestReactRendered = t.Lifecycle & {
  readonly container: HTMLDivElement;
};
