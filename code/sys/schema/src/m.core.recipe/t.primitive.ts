/**
 * Primitives
 */
export type StrSpec = {
  readonly kind: 'string';
  readonly pattern?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly description?: string;
  readonly title?: string;
  readonly format?: string;
};

export type NumSpec = {
  readonly kind: 'number';
  readonly minimum?: number;
  readonly maximum?: number;
  readonly exclusiveMinimum?: number;
  readonly exclusiveMaximum?: number;
  readonly description?: string;
  readonly title?: string;
};

export type BoolSpec = {
  readonly kind: 'boolean';
  readonly description?: string;
  readonly title?: string;
};

export type LitSpec = {
  readonly kind: 'literal';
  readonly value: string | number | boolean;
};
