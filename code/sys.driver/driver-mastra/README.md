# Mastra Driver (AI)

System wrappers for the [Mastra](https://mastra.ai/) "typescript agent framework".

- [mastra.ai](https://mastra.ai/)
- [github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra) (Apache 2.0)


## Memory (CRDT-backed)

A tiny Mastra memory adapter that stores everything in a single CRDT doc (Automerge).
Threads and v2 messages live side‑by‑side; per‑resource “working memory” is a first‑class field. Zero SQL, zero migrations, offline‑first by default.

Highlights
  •  Single‑doc storage: threads, messages, resources
  •  v2 messages only; ordered by createdAt
  •  Per‑resource working memory (markdown)
  •  Clean text extraction via textOf(...)

### Install / Import
```ts
import { Memory } from 'jsr:@sys/mastra-memory';
```

### Example
```ts
import { Crdt } from '@sys/driver-automerge/fs';
import { Mastra } from '@sys/driver-mastra';
import { Memory } from '@mastra/memory';

const repo = Crdt.repo();
const initial: t.MastraStorageDoc = { threads: {}, messages: {}, resources: {} }
const doc = repo.create(initial);
const storage = Memory.Storage.crdt({ doc });

const memory = new Memory({ storage, options: { semanticRecall: false } });
```
