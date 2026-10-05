# ProseMirror Driver

UI module wrapping the ProseMirror rich-text editor with CRDT bindings.

#### References
- https://prosemirror.net


### Example
```tsx
import { TextEditor } from 'jsr:@sys/driver-prosemirror';

export function Editor({ doc, path }) {
  return <TextEditor doc={doc} path={path} singleLine />;
}
```
