# UI: Monaco Code Editor
UI module wrapping the Monaco code editor (with CRDT bindings).

#### References
- https://github.com/microsoft/monaco-editor


## Example
See [./src/-test/entry.tsx](./src/-test/entry.tsx) for more:

```tsx
import { MonacoEditor } from '@sys/driver-monaco';
// or:
const { MonacoEditor } = await import('@sys/driver-monaco');

/**
 * Render:
 */
<MonacoEditor style={{ Absolute: 0 }} theme={'Dark'} />
```
