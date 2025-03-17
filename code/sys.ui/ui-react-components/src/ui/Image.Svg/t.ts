import type { Element as SvgElement } from '@svgdotjs/svg.js';

/**
 * SVG rendering tools.
 */
export type SvgLib = {
  Element: SvgElement;
  useSvg: UseSvg;
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
};

export type UseSvgInit = (draw: SvgElement) => void;
