import { type t, Schema } from '../common.ts';
import { SequenceIs } from './m.Is.ts';
import { SequenceSchema } from './u.schema.ts';
import { checkSequenceInvariants } from './u.schema.validate.invariants.ts';

type M = t.SlugSequenceLib['validate'];
type R = ReturnType<M>;

/**
 * Validates a raw YAML sequence against the SequenceRecipe schema
 * and returns a strongly-typed t.Sequence.
 */
export const validateSequence: M = (input: unknown) => {
  const ok = (sequence: t.SlugSequence): R => ({ ok: true, sequence });
  const fail = (message: string): R => ({ ok: false, error: new Error(message) });

  if (!Array.isArray(input)) {
    return fail('Invalid sequence: expected an array of items.');
  }

  // First pass: structural sanity for clearer errors.
  for (let i = 0; i < input.length; i += 1) {
    const item = input[i];
    if (!SequenceIs.itemLike(item)) {
      return fail(`Invalid sequence item at index ${i}: expected video/slug/pause/image item.`);
    }
  }

  // Second pass: full schema validation (same stack as the unit tests).
  const isValid = Schema.Value.Check(SequenceSchema, input);
  if (!isValid) {
    return fail('Invalid sequence: value does not conform to Sequence schema.');
  }

  // Third pass: enforced invariants that sit on top of the schema.
  const sequence = input as t.SlugSequence;
  const invariantError = checkSequenceInvariants(sequence);
  if (invariantError) {
    return fail(invariantError);
  }

  // Schema + invariants have accepted it; it is now safe to treat as t.Sequence.
  return ok(sequence);
};
