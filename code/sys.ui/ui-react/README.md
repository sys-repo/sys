# React Driver

- https://react.dev/reference/react

```ts
import { FC } from 'react';
import { createRoot } from 'react-dom/client';
```

When working within Deno you may need to enable react types within each `.tsx` file using:

```ts
// @ts-types="@types/react"
import React from 'react';
```

For more see [Deno docs](https://docs.deno.com/runtime/reference/ts_config_migration/#providing-types-when-importing) on configuring types.

---

### Notes:

- The system is ultimately "UI Abstraction Library" agnostic, and so React is just one of any DOM rendering approaches, but it is the initial implementation choice.

- That said, the system specifically chooses NOT to use React "[server rendering](https://react.dev/reference/react-dom/server)" for reason's of ultimate portability.  This will be revisted as dust settles on what React's server conceptions really are all about, how useful they actually turn out to be, or whether they turn out to be "infra company lockin" bait.


## WebFont

```ts
import { WebFont } from '@sys/ui-react';

/**
 * Define font (configuration):
 */
const ET_BOOK = WebFont.def({
  family: 'ET Book',
  variable: false,
  weights: [400, 600, 700],
  italic: true,
  local: ['ETBook-Roman', 'ETBook-Italic', 'ETBook-SemiBold', 'ETBook-Bold'],
  fileForStatic: ({ dir, family, weight, italic }) => {
    // Match your filenames exactly:
    if (weight === 400 && !italic) return `${dir}/et-book-roman-old-style-figures.woff`;
    if (weight === 400 && italic) return `${dir}/et-book-display-italic-old-style-figures.woff`;
    if (weight === 600 && !italic) return `${dir}/et-book-semi-bold-old-style-figures.woff`;
    if (weight === 700 && !italic) return `${dir}/et-book-bold-line-figures.woff`;
    return `${dir}/et-book-roman-line-figures.woff`; // fallback
  },
});


function MyComponent(){
  /**
   * Inject ET-Book font once (idempotent).
   * Folder structure: /public/fonts/et-book/*.woff
   */
  WebFont.useWebFont('/fonts/et-book', ET_BOOK);

  // ...
}
```
