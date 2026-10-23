# @sys/html

HTML parsing primitives.

Synchronous document and fragment parsing backed by parse5's default tree. Public exports are
`Html`, `pkg`, and the type-only `t` namespace; types are also available from `@sys/html/t`.

### Usage

```ts
import { Html } from 'jsr:@sys/html';

const source = '<a href="/hello?x=1&amp;y=2">Hello</a>';
const fragment = Html.parseFragment(source, { sourceCodeLocationInfo: true });
const node = fragment.childNodes[0];
if (Html.Is.element(node)) {
  const href = node.attrs.find((attr) => attr.prefix === undefined && attr.name === 'href');
  const span = node.sourceCodeLocation?.attrs?.href;
  console.info(href?.value); // → /hello?x=1&y=2
  if (span) console.info(source.slice(span.startOffset, span.endOffset));
  // → href="/hello?x=1&amp;y=2"
}
```

- `Html.parse(source, options?)` returns a recovered document, including implied html/head/body.
- `Html.parseFragment(source, options?)` returns a fragment. The context overload is
  `Html.parseFragment(context, source, options)`; pass `{}` for default options.
- `Html.Is.element(node)` narrows an element in any namespace.
- `Html.Is.template(node)` narrows an HTML template; its descendants are in `node.content`.

Without a context (or with `null`), fragments use a synthetic HTML template. Supply a context when
parsing rules depend on the containing element: table context can introduce `tbody`, while textarea
context treats markup as text. With the default adapter, the result is a separate fragment; parsing
does not append children to or modify the context.

### Contracts

Trees are mutable caller-owned parse5 data, not DOM nodes. Guards accept parser-shaped nodes,
`null`, and `undefined`; they are not validators for arbitrary objects. Compatible custom adapters
must preserve the default-tree contract and own their effects.

All four upstream options are preserved: `scriptingEnabled`, `sourceCodeLocationInfo`,
`treeAdapter`, and `onParseError`. `scriptingEnabled` defaults true, parsing `<noscript>` contents
as text; false permits markup parsing inside `<noscript>`. Scripts never execute. Locations default
false. A non-null error callback activates locations even if explicitly disabled. Diagnostics keep
upstream codes and coordinates; exceptions thrown by callbacks propagate unchanged.

Attribute values are decoded. Source offsets address the original input in UTF-16 code units, with
exclusive ends; line/column coordinates are one-based. Locations can be absent or null, including on
implied nodes. Fragment offsets address the fragment string. Tree mutation does not update source
spans, and recovery does not produce a lossless editing map.

The default parser does not fetch resources or execute scripts. Parsing is **not sanitization**. No
serialization API is exposed. There is no walker, source editor, streaming API, or Vite policy in
this package.

### Verification

From this package: `deno task check`, `deno task test`, and `deno task test:browser`. The browser
proof runs an identical example in Deno and local Chrome, audits the resolved bundle graph, and
compares emitted/gzip/Brotli sizes against direct parse5. Browser/build tooling is test-only. See
[the measured proof](./src/-test.browser/README.md); no Node/Bun compatibility or parsing-speed
claim is made.
