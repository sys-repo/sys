import { type t } from './common.ts';

/**
 * Composites
 */
export type ArrSpec = {
  readonly kind: 'array';
  readonly items: t.Recipe;
  readonly description?: string;
  readonly title?: string;
};

export type ObjSpec = {
  readonly kind: 'object';
  readonly props: { readonly [k: string]: t.Recipe };
  readonly additionalProperties?: boolean;
  readonly description?: string;
  readonly title?: string;
};

export type UnionSpec = {
  readonly kind: 'union';
  readonly variants: readonly t.Recipe[];
  readonly description?: string;
  readonly title?: string;
};

export type OptSpec = {
  readonly kind: 'optional';
  readonly of: t.Recipe;
};
