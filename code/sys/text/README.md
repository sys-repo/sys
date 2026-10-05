# @sys/text

Filter, compare, and update strings, with helpers for marked text blocks and token counts.

The root exports package metadata and types. Import the operation you need:

- [`/filter`](https://jsr.io/@sys/text/doc/filter): substring and fuzzy matching over candidates.
- [`/block`](https://jsr.io/@sys/text/doc/block) and
  [`/update`](https://jsr.io/@sys/text/doc/update): edit blocks between exact marker lines, or apply
  changes to strings.
- [`/diff`](https://jsr.io/@sys/text/doc/diff): differences between strings.
- [`/gpt`](https://jsr.io/@sys/text/doc/gpt): token encoding and counting with `o200k_base`.

## Filter candidates

```ts
import { Filter } from 'jsr:@sys/text/filter';

const results = Filter.apply(
  'fbr',
  [
    { text: 'Foo.Bar.Render', value: 'render' },
    { text: 'Foo.Bar.Router', value: 'router' },
    { text: 'Foo.Baz.Result', value: 'result' },
  ],
  {
    mode: 'fuzzy',
    limit: 10,
  },
);

console.info(results.map((result) => result.value));
```

Fuzzy matching finds query characters in order. `Filter.apply` discards nonmatches, ranks matches
from highest to lowest score, and keeps the original order on ties. It applies the limit last; an
empty query keeps the original candidate order, still subject to that limit.

Each result includes the candidate's value and score, with optional match ranges.
