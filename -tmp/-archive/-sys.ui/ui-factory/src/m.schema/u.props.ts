import { Schema } from '@sys/schema';
import { type t } from './common.ts';

/**
 * Build a `{ [id]: Validator }` map from registrations.
 * `spec.schema` fields (if present). Skips ids with no schema.
 */
export function makePropsValidators<Id extends string>(
  regs: ReadonlyArray<t.Registration<Id, t.SlotId, unknown>>,
): t.PropsValidators<Id> {
  const out: Record<string, t.Validator<unknown>> = {};

  for (const reg of regs) {
    const schema = (reg.spec as { schema?: unknown }).schema as t.TSchema;
    if (!schema) continue;

    /**
     * Normalize any schema to Standard Schema:
     * - Zod/Valibot/ArkType pass through
     * - TypeBox gets wrapped.
     */
    const std = Schema.toStandardSchema(schema);
    const api: t.Validator<unknown> = {
      /**
       * Boolean type-guard semantics derived from Standard Schema validate:
       */
      check(value: unknown): value is unknown {
        return std['~standard'].validate(value).ok;
      },

      /**
       * Strict validation on a value.
       */
      validate(value: unknown) {
        const res = std['~standard'].validate(value);
        if (res.ok) return { ok: true };

        // Map Standard Schema issues → canonical [ValidationError] shape.
        const errors = res.issues.map((issue) => ({
          path: [...issue.path] satisfies t.ObjectPath,
          message: issue.message,
        })) satisfies readonly t.ValidationError[];

        return { ok: false, errors };
      },
    };

    out[reg.spec.id] = api;
  }

  return out as t.PropsValidators<Id>;
}

/**
 * Validate props against a prebuilt validator map.
 * No schema → `{ ok:true }`.
 */
export function validateProps<Id extends string>(
  id: Id,
  props: unknown,
  validators: t.PropsValidators<Id>,
): t.ValidateResult {
  const v = validators[id];
  return v ? v.validate(props) : { ok: true };
}
