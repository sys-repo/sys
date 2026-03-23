# @sys/esm
ESM import and dependency helpers.

## Usage
```ts
import { Esm, pkg } from 'jsr:@sys/esm';
```

<p>&nbsp;</p>

## /core
`@sys/esm/core` provides the core dependency kernel for ESM workspaces.

```ts
import { Esm } from 'jsr:@sys/esm/core';
```

Its core surfaces are split deliberately:

- registry adapters report package and version facts
- policy decides which upgrades are allowed
- topological ordering computes a deterministic dependency-safe order
- downstream drivers project the canonical result into runtime files

This separation keeps dependency decisions explicit, reproducible, and easier to test.

Key properties:

- deterministic ordering for the same graph input
- explicit failure on invalid graph references and cycles
- canonical manifest state as the planning input
- projected file updates treated as outputs of the plan, not the source of truth


<p>&nbsp;</p>


## /deps
`@sys/esm/deps` provides the canonical `deps.yaml` manifest layer.

```ts
import { Deps } from 'jsr:@sys/esm/deps';
```

It owns:

- normalized dependency manifest entries
- manifest loading from YAML text or file path
- rendering canonical state back to `deps.yaml`
- pure inputs for downstream driver projections
