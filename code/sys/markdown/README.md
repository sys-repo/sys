# Markdown
Markdown parsing and serialization primitives.

### Usage
```ts
import { Markdown } from '@sys/markdown';

const res = Markdown.parse('# Hello');
if (res.error) throw res.error;

const ast = res.data;
```
