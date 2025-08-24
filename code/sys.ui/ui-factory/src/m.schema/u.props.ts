import type { t } from './common.ts';
import { makeValidator } from './u.validate.ts';

/** Build a `{ [id]: Validator }` map from registrations that provide `spec.schema`. */
export function makePropsValidators<Id extends string>(
  regs: ReadonlyArray<t.Registration<Id, t.SlotId, unknown>>,
): t.PropsValidators<Id> {
  const out: Record<string, t.Validator<unknown>> = {};
  for (const r of regs) {
    const schema = (r.spec as { schema?: t.TSchema }).schema;
    if (schema) out[r.spec.id] = makeValidator(schema);
  }
  return out as t.PropsValidators<Id>;
}

/** Validate props against a prebuilt validator map; no schema → { ok:true }. */
export function validateProps<Id extends string>(
  id: Id,
  props: unknown,
  validators: t.PropsValidators<Id>,
) {
  const v = validators[id];
  return v ? v.validate(props) : ({ ok: true } as const);
}
