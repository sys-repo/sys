/**
 * @module types
 */
export type * from './m.client/t.ts';

export type WireSchemaValueError = {
  readonly path: string | readonly string[];
  readonly message: string;
};
