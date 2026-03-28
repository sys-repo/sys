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

Surfaces (dependency model):

- import and module helpers
- policy for upgrade eligibility
- topological ordering for dependency-safe execution order
- canonical result shapes for downstream projections


These surfaces keep dependency reasoning legible, deterministic, and projection-safe.

Key properties:

- deterministic ordering for the same graph input
- explicit failure on invalid graph references and cycles
- designed to consume canonical dependency state, typically from `@sys/esm/deps`
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
