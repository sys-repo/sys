/**
 * @module types
 */
export type * from './m.client/t.ts';

export type SchemaValueError = {
  readonly path: string | readonly string[];
  readonly message: string;
};
