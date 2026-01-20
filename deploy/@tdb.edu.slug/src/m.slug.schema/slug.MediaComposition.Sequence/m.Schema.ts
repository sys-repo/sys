import { type t } from '../common.ts';
import { SequenceIs as Is } from './m.Is.ts';
import { validateSequence as validate } from './u.schema.validate.ts';

/**
 * Schema-focused helpers for authoring-time slug sequences.
 * Exposes only guards + validation (no compiler ops).
 */
export const SequenceSchema: t.SlugSequenceSchemaLib = {
  Is,
  validate,
};
