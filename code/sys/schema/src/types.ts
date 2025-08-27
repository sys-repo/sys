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
  TArray,
  TBoolean,
  TLiteral,
  TNull,
  TNumber,
  TObject,
  TOptional,
  TRecursive,
  TSchema,
  TString,
  TUnion,
  TUnknown,
} from '@sinclair/typebox';
export type { ValueError } from '@sinclair/typebox/errors';
