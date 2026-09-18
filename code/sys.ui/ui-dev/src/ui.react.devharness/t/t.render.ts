import type { t } from './common.ts';

type Id = string;
type RendererId = Id;
type O = Record<string, unknown>;

/** Value a DevHarness renderer may return to React. */
export type RenderedResult = t.JSXElement | undefined | null;

/**
 * Function that returns a renderable element.
 */
export type DevRenderer<T extends O = O> = (
  args: DevRendererArgs<T>,
) => RenderedResult | Promise<RenderedResult>;

/** Arguments passed to a DevHarness renderer. */
export type DevRendererArgs<T extends O = O> = {
  id: RendererId;
  state: T;
  size: t.DevRenderedSize;
};

/**
 * Response to the assignment of a renderer that provides
 * hooks for re-drawing the component.
 */
export type DevRenderRef = { id: Id; redraw(): void };
/** Registered renderer function and stable renderer identity. */
export type DevRendererRef<T extends O = O> = { id: RendererId; fn: DevRenderer<T> };
