# DevHarness (Primitives)
Development harness for visual specs: render layout, spec execution, and runtime context.

## `/react/spec`
Typed entry point for spec loading and materialization:

```ts
import { Loader, type t } from '@sys/ui-react-devharness/react/spec';
```

Source spec:

```tsx
import { Loader, type t } from '@sys/ui-react-devharness/react/spec';
import { Spec } from '@sys/ui-react-devharness/react';

type Foo = { count: number };

export const createSpec: t.Loader.Factory<Foo> = (params) => {
  return Spec.describe('MySpec', (e) => {
    e.it('init', (e) => {
      const ctx = Spec.ctx(e);
      ctx.subject.render(() => <div>{`👋 hello ${params.count}`}</div>);
    });
  });
};

export default createSpec({ count: 0 });
```

Declaring parameterized specs:

```ts
import { Loader, type t } from '@sys/ui-react-devharness/react/spec';

export const Specs = {
  'sample.foo': Loader.load(() => import('./-SPEC.tsx'), { count: 123 }),
} as t.SpecImports;
```
