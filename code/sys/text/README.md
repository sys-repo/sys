# Text Helpers
Tools for working with [strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) of text.

<p>&nbsp;</p>



### Filter
A small, composable text-filtering primitive for fast, human-friendly search — designed to normalize loose queries once, score matches deterministically, and stay predictable under iteration.

```ts
import { Filter } from '@sys/text/filter';

const results = Filter.apply(
  'fbr',
  [
    { text: 'Foo.Bar.Render', value: 'render' },
    { text: 'Foo.Bar.Router', value: 'router' },
    { text: 'Foo.Baz.Result', value: 'result' },
  ],
  {
    mode: 'fuzzy', // loose, in-order character matching for quick recall-style search
    limit: 10,
  },
);

// → forgiving, ranked matches suited to jump-to-anything navigation
```

