# Markdown
Markdown parsing, serialization, and safe rendering primitives.

### Usage
```ts
import { Markdown } from '@sys/markdown';

const parsed = Markdown.parse('# Hello');
if (parsed.error) throw parsed.error;

const ast = parsed.data;
const rendered = Markdown.Html.render(ast);
if (rendered.error) throw rendered.error;

const html = rendered.data;
```
