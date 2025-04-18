import type { Element as SvgElement } from '@svgdotjs/svg.js';
import type { t } from './common.ts';

export { SvgElement };

type NumberWidth = t.Pixels;
type NumberHeight = t.Pixels;

/**
 * SVG rendering tools.
 */
export type SvgLib = {
  readonly Element: SvgElement;
  readonly useSvg: UseSvgFactory;
};

/**
 * Hook: SVG image import/renderer.
 */
export type UseSvgFactory = {
  <T extends HTMLElement>(
    svgImport: SvgImportInput,
    viewBox: [NumberWidth, NumberHeight],
    init?: UseSvgInit<T> | NumberWidth,
  ): SvgInstance<T>;

  <T extends HTMLElement>(
    svgImport: SvgImportInput,
    viewBox: number[], // NB: type-hack so typescript does not complain when number-arrays (rather than a tuple) is passed.
    init?: UseSvgInit<T> | NumberWidth,
  ): SvgInstance<T>;
};

/** Input parameter for the `useSvg` hook. */
export type SvgImportInput = string | (() => SvgImportPromise);

/** An dynamic import of an SVG file: eg, `import('path/to/file.svg')`. */
export type SvgImportPromise = Promise<{ default: string }>;

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
