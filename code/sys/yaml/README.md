# @sys/yaml

Parse, serialize, and edit YAML, with separate helpers for configuration files.

- The root and [`/core`](https://jsr.io/@sys/yaml/doc/core) export the same `Yaml` library for
  in-memory parsing, serialization, syntax-tree inspection, and edits by path.
- [`/cli`](https://jsr.io/@sys/yaml/doc/cli) exports `YamlConfig` for configuration-file operations
  and interactive menus.
- `/t` exports types only.

## Parse YAML

```ts
import { Yaml } from 'jsr:@sys/yaml';

const result = Yaml.parse<{ name: string }>('name: example');
if (result.error) throw result.error;

console.info(result.data?.name); // → example
```

Parsing returns `{ data, error }`. Empty input is valid and yields `data: null`.

The type argument describes what you expect; it does not validate the parsed data. Validate
untrusted data against a schema before relying on its shape.

For the document's comments, source ranges, and parser errors, use `Yaml.parseAst`. Like parsing,
`Yaml.stringify` returns a result object, not a bare string. See the
[API documentation](https://jsr.io/@sys/yaml/doc/core) for syntax-tree and serialization details.
