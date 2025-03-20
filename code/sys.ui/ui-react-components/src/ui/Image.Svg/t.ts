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
  svgImport: SvgImportInput,
  viewboxWidth?: number,
  viewboxHeight?: number,
  init?: UseSvgInit<T>,
) => SvgInstance<T>;

export type SvgImportInput = string | (() => SvgImportPromise);

/** An dynamic import of an SVG file: eg, `import('path/to/file.svg')`. */
export type SvgImportPromise = Promise<typeof import('*.svg')>;

/** Callback to initialize the SVG upon creation. */
export type UseSvgInit<T extends HTMLElement> = (e: UseSvgInitArgs<T>) => void;
export type UseSvgInitArgs<T extends HTMLElement> = Pick<SvgInstance<T>, 'query' | 'queryAll'> & {
  /** Drawing API. */
  readonly draw: SvgElement;
};

/**
 * An instance of an SVG image with API for manipulating
 * the it programatically.
 */
export type SvgInstance<T extends HTMLElement> = {
  readonly ready: boolean;
  readonly ref: React.RefObject<T>;
  readonly draw?: SvgElement;
  query(selector: string): SvgElement | undefined;
  queryAll(selector: string): SvgElement[];
};
