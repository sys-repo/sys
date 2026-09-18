# @sys/workspace

Workspace orchestration helpers for multi-package repositories.

### Usage

```ts
import { Workspace } from 'jsr:@sys/workspace';
```

### Test runner telemetry

Workspace test progress is package-level scheduler truth first. Native Deno test counts are optional
final report facts from instrumentable `deno test ...` tasks; unsupported or unavailable stats
render as `—`, not `0`.
