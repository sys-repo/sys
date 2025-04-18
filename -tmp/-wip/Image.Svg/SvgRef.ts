import * as t from './types';
import { SVG } from './libs';

/**
 * A helper for working with <SVG> objects within a given DOM container element.
 *
 * NOTE:
 *    This helper assumes <svg> data assembled via the webpack plugin
 *    (see [cell.compiler]).
 */
export function SvgRef(filename: string, elContainer: HTMLElement): t.SvgRef {
  filename = (filename ?? '')
    .trim()
    .replace(/^\#/, '')
    .replace(/\.svg$/, '');
  filename = `${filename}.svg`;

  return {
    filename,
    find(id: string) {
      id = (id || '').trim().replace(/^\#/, '');
      const query = `#${Format.toId(filename)}__${Format.toId(id)}`;
      const el = elContainer.querySelector(query);
      return el ? SVG(el) : undefined;
    },
  };
}

/**
 * [Helpers]
 */

const Format = {
  toId: (value: string) => value.replace(/\./g, '_'),
};
