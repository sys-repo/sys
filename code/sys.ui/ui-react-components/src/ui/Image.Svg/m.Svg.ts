import { SvgElement as Element } from './common.ts';
import { useSvg } from './use.Svg.ts';

/**
 * Helpers for working with SVG objects within the given container element.
 *
 * NOTE:
 *    This helper assumes <svg> data assembled via the webpack plugin
 *    (see [cell.compiler]).
 */
export const Svg = {
  Element,
  useSvg,
};
