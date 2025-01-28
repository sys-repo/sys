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

