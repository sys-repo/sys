import { type t } from '../common.ts';
import { SequenceIs as Is } from './m.Is.ts';
import { SequenceList as List } from './u.schema.ts';
import { checkSequenceInvariants as checkInvariants } from './u.validate.invariants.ts';
import { validateSequence as validate } from './u.validate.ts';

/**
 * Schema-focused helpers for authoring-time slug sequences.
 * Exposes only guards + validation (no compiler ops).
 */
export const SequenceSchema: t.SlugSequenceSchemaLib = {
  Is,
  List,
  validate,
  checkInvariants,
};
