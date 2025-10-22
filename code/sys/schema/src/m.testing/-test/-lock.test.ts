import { describe, it } from '../../-test.ts';
import { type t, Type as T } from '../../mod.ts';
import type { CheckSchemaConcrete, CheckSchemaExact, CheckSchemaKeys, Expect } from '../u.lock.ts';

/**
 * Compile-time schema/type locks.
 *
 * Ensures each schema:
 *   • infers a concrete type (not any / unknown / never)
 *   • has an identical key set to its public type
 *   • matches the public type exactly (no rename / drift / extras)
 *
 * Any mismatch between schema ↔ generated types fails at compile-time.
 * No runtime test required.
 */

describe('schema drift locks (demo)', () => {
  // Keep the schema concrete (no widening), so t.Infer<> is rich.
  const PersonSchema = T.Object(
    {
      id: T.String({ minLength: 1 }),
      name: T.String({ minLength: 1 }),
      nick: T.Optional(T.String({ minLength: 1 })),
    },
    { $id: 'demo.person', additionalProperties: false },
  );

  // Generated public type (aka. t.type-gen.ts):
  type Person = {
    readonly id: string;
    readonly name: string;
    readonly nick?: string;
  };

  // POSITIVE — all locks pass
  type _Concrete = Expect<CheckSchemaConcrete<typeof PersonSchema>>;
  type _Keys = Expect<CheckSchemaKeys<typeof PersonSchema, Person>>;
  type _Exact = Expect<CheckSchemaExact<typeof PersonSchema, Person>>;

  // NEGATIVE — missing prop (fails Exact)
  type PersonMissing = { readonly id: string; readonly name: string };
  // @ts-expect-error - missing `nick?` must fail exact match
  type _Fail_Missing = Expect<CheckSchemaExact<typeof PersonSchema, PersonMissing>>;

  // NEGATIVE — renamed key (fails Keys and Exact)
  type PersonRenamed = { readonly id: string; readonly name: string; readonly nickname?: string };
  // @ts-expect-error - key set differs (`nick` vs `nickname`)
  type _Fail_Renamed_Keys = Expect<CheckSchemaKeys<typeof PersonSchema, PersonRenamed>>;
  // @ts-expect-error - structure is not exact
  type _Fail_Renamed_Exact = Expect<CheckSchemaExact<typeof PersonSchema, PersonRenamed>>;

  // NEGATIVE — schema drift example (rename in schema)
  const PersonSchemaDrift = T.Object(
    {
      id: T.String({ minLength: 1 }),
      nameX: T.String({ minLength: 1 }), // drift
      nick: T.Optional(T.String({ minLength: 1 })),
    },
    { $id: 'demo.person.drift', additionalProperties: false },
  );
  // @ts-expect-error - drifted key set (`nameX` vs `name`)
  type _Fail_Drift_Keys = Expect<CheckSchemaKeys<typeof PersonSchemaDrift, Person>>;
  // @ts-expect-error - structure is not exact
  type _Fail_Drift_Exact = Expect<CheckSchemaExact<typeof PersonSchemaDrift, Person>>;

  // 5) NEGATIVE — widening trap (should be rejected by Concrete)
  const Widened = PersonSchema as t.TSchema;
  // @ts-expect-error - widened schemas must not pass the concrete check
  type _Fail_Widened_Concrete = Expect<CheckSchemaConcrete<typeof Widened>>;

  it('noop: compiles — type-level only (no runtime)', () => {
    // noop; this test exists purely for compile-time locks.
  });
});
