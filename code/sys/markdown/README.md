# Markdown
Markdown parsing, serialization, frontmatter, and safe rendering primitives.

### Usage
```ts
import { Markdown } from '@sys/markdown';

const parsed = Markdown.parse('# Hello');
if (parsed.error) throw parsed.error;

const doc = Markdown.Frontmatter.parse('---\ntitle: Hello\n---\n# Hello');
if (doc.error) throw doc.error;

const rendered = Markdown.Html.render(doc.data.ast);
if (rendered.error) throw rendered.error;

const ast = parsed.data;
const meta = doc.data.frontmatter?.data;
const html = rendered.data;
```
