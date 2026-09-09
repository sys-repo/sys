# Crdt
Abstract, implementation-agnostic CRDT type symbols.

### Purpose

Defines CRDT contracts without binding to an engine.
Runtime implementations live in driver packages such as `@sys/driver-automerge`.

### Usage

```ts
import type { Crdt } from 'jsr:@sys/crdt/t';
```
