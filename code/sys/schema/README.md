# Type Schema

"[Standard Schema](https://standardschema.dev/)" (Typescript/JSONSchema) tools.

Runtime type builder for:
- Static type checking with Typescript.
- Runtime reflection via JSONSchema.


### Example
```ts
import { Schema } from 'jsr:@sys/schema';

const T = Type.Object({
  id: Type.Integer(),
  name: Type.Optional(Type.String({description: 'Display name.'})),
});

type T = t.Static<typeof T>; // Invert proper TS type.
const value = {
  id: 123,
  name: 'foo',
  noise: '👋',
};

const result = Schema.try(() => Value.Parse(SampleSchema, value)); 
// ↑ valid: { id: 123, name: 'foo' }

```
