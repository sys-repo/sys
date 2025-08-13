# Type Schema

"[Standard Schema](https://standardschema.dev)" (Typescript/JSONSchema) tools.

Runtime type builder for:
- Runtime reflection via JSONSchema.
- Static type checking with Typescript (zero drift from JSONSchema).
- Signal generation around schema shape.


### Refs:
- [standardschema.dev](https://standardschema.dev)
- [json-schema.org](https://json-schema.org)
- [github.com/sinclairzx81/typebox](https://github.com/sinclairzx81/typebox)



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
