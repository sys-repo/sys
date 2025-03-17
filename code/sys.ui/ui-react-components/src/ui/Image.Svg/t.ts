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
  init?: UseSvgInit,
) => UseSvgInstance<T>;

export type UseSvgInstance<T extends HTMLElement> = {
  readonly ref: React.RefObject<T>;
  readonly draw: SvgElement | undefined;
  find<T extends SVGElement>(id: string): T | undefined;
};

export type UseSvgInit = (draw: SvgElement) => void;
