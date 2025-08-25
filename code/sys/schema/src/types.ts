/**
 * Module types.
 * @module
 */
export type * from './m.Schema/t.ts';

/**
 * Export from upstream library ("Typebox"):
 */
export type {
  Static,
  TLiteral,
  TObject,
  TOptional,
  TSchema,
  TString,
  TUnion,
} from '@sinclair/typebox';
export type { ValueError } from '@sinclair/typebox/errors';
