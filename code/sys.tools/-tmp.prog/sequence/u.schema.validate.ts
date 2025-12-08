import { type t, Schema, toSchema } from '../common.ts';
import { SequenceIs } from './m.Is.ts';
import { SequenceRecipe } from './u.schema.ts';

/**
 * Precomputed runtime schema for the sequence.
 */
const SequenceSchema = toSchema(SequenceRecipe);

/**
 * Validates a raw YAML sequence against the SequenceRecipe schema
 * and returns a strongly-typed t.Sequence.
 */
type M = t.SequenceLib['validate'];
type R = ReturnType<M>;

export const validate: M = (input: unknown) => {
  const ok = (sequence: t.Sequence): R => ({ ok: true, sequence });
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

  // Schema has accepted it; it is now safe to treat as t.Sequence.
  return ok(input as t.Sequence);
};
