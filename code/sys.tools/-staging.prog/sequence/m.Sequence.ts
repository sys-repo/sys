import { type t } from '../common.ts';
import { SequenceIs as Is } from './m.Is.ts';
import { validate } from './u.schema.validate.ts';

export const Sequence: t.SequenceLib = {
  Is,
  validate,
};
