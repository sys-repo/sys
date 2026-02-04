import type { t } from './common.ts';

/**
 * URL value for a single row (supports single or multiple origins).
 */
export type HttpOriginValue = t.StringUrl | readonly t.StringUrl[];

export type HttpOriginMap__LEGACY = {
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};

/**
 * Data structure for modelling a map of origin-urls.
 */

/**
 * Self-describing origin tree node.
 * Leaf nodes carry values per env; group nodes carry children.
 */
export type HttpOriginNode<E extends string = string> =
  | {
      readonly kind: 'group';
      readonly key: string;
      readonly label?: string;
      readonly children: readonly HttpOriginNode<E>[];
    }
  | {
      readonly kind: 'leaf';
      readonly key: string;
      readonly label?: string;
      readonly values: Readonly<Record<E, HttpOriginValue>>;
    };
