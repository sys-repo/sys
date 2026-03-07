# Type Schema

"[Standard Schema](https://standardschema.dev)" (Typescript/JSONSchema) tools.

Runtime type definition builder for:
- Runtime reflection via **JSONSchema**.
- Static type checking via **Typescript** types (zero drift from the JSONSchema).
- **JSR-safe** bundle export strategy (safely avoids "no slow types" constraint registry errors).
- [Standard Schema](https://standardschema.dev) specification implementation.


### Refs:
- [standardschema.dev](https://standardschema.dev)
- [json-schema.org](https://json-schema.org)



### Example
```ts
import { Schema, type Static } from 'jsr:@sys/schema';

// Define the type:         // ← (is an augmented valid JSONSchema object)
const T = Type.Object({
  id: Type.Integer(),
  name: Type.Optional(Type.String({description: 'Display name.'})),
});


// Infer TS type:
type T = Static<typeof T>;  // Invert proper TS type.

const value = {
  id: 123,
  name: 'foo',
  noise: '👋',
};


// Runtime validation:
const cleaned = Value.Clean(T, Value.Clone(value));   // ← (remove values not in the type)
const isValid = Value.Check(T, { id: 0 });            // ← true
Value.Assert(T, { foo: 'fail' });                     // ← throws

// Rollup of runtime pipeline steps into "safe parse":
const result = Schema.try(() => Value.Parse(SampleSchema, value));
// ↑ valid: { id: 123, name: 'foo' }

```
