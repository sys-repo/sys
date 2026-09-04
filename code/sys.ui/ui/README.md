# @sys/ui

Reusable System UI composition over domain contracts.

```tsx
import { Files } from '@sys/ui/react/files';

export function StatusPanel() {
  return <Files.InfoPanel snapshot={{ status: 'ready' }} />;
}
```

