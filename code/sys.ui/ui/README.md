# @sys/ui

React components for System domain models. The root exports `pkg` and types; import components from
their own entrypoints.

`/react/files` exports `Files.InfoPanel`, which displays snapshots from a Files client. Use
`UI.Uncontrolled` for plain props or `UI.Controlled` for signal-backed props.

```tsx
import { Files } from 'jsr:@sys/ui/react/files';

export function StatusPanel() {
  return <Files.InfoPanel.UI.Uncontrolled snapshot={{ status: 'ready' }} />;
}
```

Use a React TSX toolchain that resolves JSR imports. The example displays a fixed snapshot, not a
live connection. The panel does not create a Files client or read its status for you. Supply
snapshots and any callbacks for connecting, disconnecting, or toggling events.

If you create a `Files.InfoPanel.controller`, dispose it when you no longer need it.

[Files UI API](https://jsr.io/@sys/ui/doc/react/files)
