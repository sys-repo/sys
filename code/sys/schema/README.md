# Type Schema

Runtime schema construction and validation with inferred TypeScript types, JSON Schema,
and [Standard Schema](https://standardschema.dev) integration.

## Example

```ts
import { Schema, Type, Value, type t } from 'jsr:@sys/schema';

const Person = Type.Object({
  id: Type.Integer(),
  name: Type.Optional(Type.String({ description: 'Display name.' })),
});
type Person = t.Static<typeof Person>;

const input = { id: 123, name: 'Ada', noise: 'removed' };
const cleaned = Value.Clean(Person, Value.Clone(input));
console.log(cleaned); // { id: 123, name: 'Ada' }
console.log(Value.Check(Person, { id: 0 })); // true

const result = Schema.try(() => Value.Parse(Person, input));
if (result.ok) {
  const person: Person = result.value;
  console.log(person.id);
} else {
  console.log(result.errors);
}
```

`Value.Clean` removes values outside the schema; clone first to preserve the input.
`Value.Check` returns a boolean, while `Value.Assert` throws on invalid data.
`Schema.try` returns `{ ok: true, value }` or `{ ok: false, errors }` for schema
assertion failures. Unexpected errors are rethrown, not converted into validation results.

## Entry points

- [Root API](https://jsr.io/@sys/schema/doc/): `Schema`, `Type`, `Value`, and `type t`.
  Infer schema types with `t.Static<typeof schema>`.
- [`/recipe`](https://jsr.io/@sys/schema/doc/recipe/): schema recipes.
- [`/testing`](https://jsr.io/@sys/schema/doc/testing/): schema testing helpers.
- [`/t`](https://jsr.io/@sys/schema/doc/t/): type-only surface.

References: [JSON Schema](https://json-schema.org) ·
[Standard Schema](https://standardschema.dev).
