import { Element as SvgElement } from '@svgdotjs/svg.js';

export type SvgRef = {
  filename: string;
  find(id: string): SvgElement | undefined;
};
