import { Is, type t } from './common.ts';

type O = Record<string, unknown>;

export const toEdges: t.CssToEdges<t.CssEdges> = (input, options = {}) => {
  if ((Array.isArray(input) && input.length === 0) || Is.blank(input)) {
    const { defaultValue } = options;
    if (defaultValue && !Is.blank(defaultValue)) {
      input = defaultValue;
    } else {
      return {};
    }
  }

  input = input || 0;

  if (!Array.isArray(input)) {
    input = input.toString().split(' ') as [t.CssEdgeInput];
  }

  const edges = input
    .map((n) => (typeof n === 'string' && n.endsWith('px') ? n.replace(/px$/, '') : n))
    .map((item) => wrangle.asNumber(item));

  let top: number | undefined;
  let right: number | undefined;
  let bottom: number | undefined;
  let left: number | undefined;

  const getEdge = (index: number): number | undefined => {
    const edge = edges[index];
    if (edge === null || edge === 'null' || edge === '') return undefined;
    return edge;
  };

  switch (edges.length) {
    case 1:
      top = getEdge(0);
      bottom = getEdge(0);
      left = getEdge(0);
      right = getEdge(0);
      break;

    case 2:
      top = getEdge(0);
      bottom = getEdge(0);
      left = getEdge(1);
      right = getEdge(1);
      break;

    case 3:
      top = getEdge(0);
      left = getEdge(1);
      right = getEdge(1);
      bottom = getEdge(2);
      break;

    default:
      top = getEdge(0);
      right = getEdge(1);
      bottom = getEdge(2);
      left = getEdge(3);
  }

  if (top === undefined && right === undefined && bottom === undefined && left === undefined) {
    return {};
  } else {
    return { top, right, bottom, left };
  }
};

export const toMargins: t.CssToEdges<t.CssMarginEdges> = (input, options = {}) => {
  return prefixEdges<t.CssMarginEdges>('margin', toEdges(input, options));
};

export const toPadding: t.CssToEdges<t.CssPaddingEdges> = (input, options = {}) => {
  return prefixEdges<t.CssPaddingEdges>('padding', toEdges(input, options));
};

/**
 * Helpers
 */

/** Prefixes each of the edge properties with the given prefix. */
export function prefixEdges<T extends O>(prefix: string, edges: Partial<t.CssEdges>): T {
  return Object.keys(edges).reduce((acc, key) => {
    const value = edges[key as keyof t.CssEdges];
    key = `${prefix}${key[0].toUpperCase()}${key.substring(1)}`;
    return { ...acc, [key]: value };
  }, {}) as T;
}

const wrangle = {
  defaultValue(value?: t.CssEdgeDefault) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number' || typeof value === 'string') return value;
    return null;
  },

  asArray(input: t.CssEdgesInput, defaultValue?: t.CssEdgeDefault) {
    if (input === null || input === undefined) return [wrangle.defaultValue(defaultValue)];
    return Array.isArray(input) ? input : [input];
  },

  asNumber(value: any) {
    if (Is.blank(value)) return value;

    value = typeof value === 'string' ? value.trim() : value;
    const num = parseFloat(value);
    if (num === undefined) return value;
    if (num.toString().length !== value.toString().length) return value;

    return Number.isNaN(num) ? value : num;
  },
} as const;
