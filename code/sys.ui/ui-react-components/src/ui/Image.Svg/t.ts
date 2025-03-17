import type { Element as SvgElement } from '@svgdotjs/svg.js';

export { SvgElement };

/**
 * SVG rendering tools.
 */
export type SvgLib = {
  readonly Element: SvgElement;
  readonly useSvg: UseSvg;
};

/**
 * Hook: SVG image import/renderer.
 */
export type UseSvg = <T extends HTMLElement>(
  base64: string,
  viewboxWidth?: number,
  viewboxHeight?: number,
  init?: UseSvgInit<T>,
) => SvgInstance<T>;

/** Callback to initialize the SVG upon creation. */
export type UseSvgInit<T extends HTMLElement> = (svg: SvgInstance<T>) => void;

/**
 * An instance of an SVG image with API for manipulating
 * the it programatically.
 */
export type SvgInstance<T extends HTMLElement> = {
  readonly ref: React.RefObject<T>;
  readonly draw: SvgElement | undefined;
  query(selector: string): SvgElement | undefined;
  queryAll(selector: string): SvgElement[];
};
