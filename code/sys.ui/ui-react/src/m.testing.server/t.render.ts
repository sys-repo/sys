import type { t } from './common.ts';

/** Renders an element into the service-side test DOM. */
export type TestReactRender = (
  el: t.ReactNode,
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
