# @sys/ui-react

React bindings for system signals, component helpers, hooks, and lifecycle control. This package
supports React applications; it is not a renderer or a component collection.

## Entry points

- **Components and hooks:** [/fc](https://jsr.io/@sys/ui-react/doc/fc) decorates functional
  components; [/use](https://jsr.io/@sys/ui-react/doc/use) provides reusable hooks, including
  `useWebFont`. The root also exports these helpers and `WebFont`.
- **Reactivity and lifecycle:** [/signal](https://jsr.io/@sys/ui-react/doc/signal) binds signals to
  React; [/effect](https://jsr.io/@sys/ui-react/doc/effect) and
  [/async](https://jsr.io/@sys/ui-react/doc/async) provide effect and lifecycle helpers.
- **Testing:** [/testing/server](https://jsr.io/@sys/ui-react/doc/testing/server) provides React
  test helpers and a mock DOM, not a real browser.

## Usage

Use a React TSX toolchain that resolves JSR imports:

```tsx
import { Signal } from 'jsr:@sys/ui-react/signal';

export function Counter() {
  const count = Signal.useSignal(0);
  Signal.useRedrawEffect(() => {
    count.value; // Subscribe this component's redraw to this signal.
  });

  return (
    <button type='button' onClick={() => count.value += 1}>
      {count.value}
    </button>
  );
}
```

`useRedrawEffect` tracks the signals read inside its callback and coalesces redraws through a
microtask. The explicit subscription above does not rely on compiler-injected signal tracking.

`Signal.useEffect` and `useRedrawEffect` accept callbacks that may return cleanup functions. Cleanup
runs on effect rerun or component unmount. Accessing the callback's `e.life` creates a per-run
lifecycle that is disposed after that cleanup; the hook itself returns no disposer.

See the [API documentation](https://jsr.io/@sys/ui-react/doc) for the remaining helpers and
[React's reference](https://react.dev/reference/react) for React itself.
