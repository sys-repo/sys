@sys.html
html-capability.plan.md
- [x] GATE Human approves the HTML capability design in the actual /sys context
- [x] c08a1b1b1 chore(html): scaffold the HTML package - @sys/html
- [x] f5300ab95 feat(html): expose HTML parsing contracts
- [x] 9200caae6 refactor(driver-vite): migrate HTML parsing to @sys/html

## Design proposal: HTML interpretation, not source rewriting

Recommend `@sys/html` at `code/sys/html`, exporting `Html`: synchronous HTML parsing into parse5's
default tree, with decoded attributes, parser diagnostics, and original-source locations. This is a
human-approved design; the approval evidence is recorded below. Approval resolves the design gate
for all three implementation items but does not itself authorize implementation or Git mutation.

The strongest case against extraction is that one workflow already uses parse5 directly. The case
for it is narrower than hypothetical reuse: one dependency owner, a discoverable type contract, and
tested element/template narrowing that removes existing consumer interop code. If that boundary
gains Vite policy or a second AST, prefer the existing direct dependency.

## Findings: pre-adoption consumers and coverage

Pre-adoption repository searches, including ignored first-party source while excluding
dependency/build/cache copies, found two direct parse5 import sites. Both were read. Metadata/lockfile
references and third-party internal usage are not additional consumer migrations. Recheck this
inventory before implementation and at closeout; newly discovered first-party callers must be
covered or adjudicated.

Paths below are workspace-relative. The Vite integrity area is
`code/sys.driver/driver-vite/src/m.vite.plugins/m.HtmlIntegrity/`.

- `u.html.ts`, `htmlReferences`: document parsing, scripting flag, locations and error callback →
  `Html.parse` with unchanged options and callback behavior.
- Its traversal: default-tree nodes, child nodes and namespaces → direct `t.Html` aliases and
  `Html.Is.element`.
- Its template branch: namespace/tag test, Template cast and `tree.getTemplateContent` →
  `Html.Is.template(node)` then `node.content`; no adapter object or cast.
- Its `attribute` and `finalizeIntegrityHtml`: decoded values, prefix identity and attribute offsets
  → unchanged `attrs` and nullable/optional `sourceCodeLocation` fields.
- `-test/-u.htmlIntegrity.test.ts`: reparse effective inserted attributes → `Html.parseFragment` and
  `Html.Is.element`; retain expected values and idempotence assertions.

Also read `m.HtmlIntegrity.ts`, `-test/-html-integrity.build.test.ts`, the Vite plugin type
contract, and the browser-test entry. Input traversal matches Vite consumption, while output
traversal covers browser-active resources. Their different scripting, namespace and template rules
are deliberate consumer behavior, not a generic traversal algorithm to extract.

## Follow-up call site: Deploy build-reset HTML

After `@sys/html` lands, reassess `code/sys.tools/src/cli.deploy/u.staging/u.buildReset.ts`,
especially `withBuildResetMeta` and its regex-based head/meta matching. Its caller is
`code/sys.tools/src/cli.deploy/u.staging/u.generateHtml.ts::ensureIndexHtml`.

A separate Tools refactor could use parsed element/attribute identity and original-source locations
to select the `x-build-reset` tag or an insertion point. Keep source edits, token policy, filesystem
ownership, and formatting in Tools; do not add an editor or serializer to `Html` for this caller.
Recovered or implied nodes may lack source spans, so define an explicit fallback rather than
assuming every parsed head can be edited at an offset. Pin behavior with owner tests for real head
and meta elements versus lookalikes in comments, scripts and templates, attribute
order/case/quoting, missing heads, repeated application, and preservation of unrelated source bytes.
Any intentional change from the current matching behavior needs its own explicit contract.

This is a follow-up reference, not another item or completion requirement in this plan's arc. It
must not block the Dist staging migration or expand the initial Vite-only adoption. The directory
index template, link construction, and escaping in `u.generateHtml.ts` are not parser migrations.

## Evidence: package conventions and upstream

- Local Markdown: `code/sys/markdown/deno.json`, `src/mod.ts`, `src/types.ts`,
  `src/m.Markdown/t.ts`, `src/m.Markdown/mod.ts`, and `src/m.Markdown.Html/u.render.ts`. It
  establishes a semantic namespace, frozen library objects, direct upstream AST aliases, and
  isolated ./t. Its sanitized Markdown rendering is not arbitrary HTML parsing.
- Local YAML: `code/sys/yaml/deno.json`, `src/mod.ts`, `src/types.ts`, and
  `src/m.core/{t.ts,t/t.lib.ts,t/t.Ast.ts,t/t.namespace.ts,u/u.parse.ts}`. It mixes plain-value
  result wrappers with direct document parsing; there is no requirement to impose `{ data, error }`
  on a recovering HTML parser. Its /core alias is not a reason to add one.
- Published JSR metadata matched local versions; the published contracts were consulted directly:
  [Markdown 0.0.23 types](https://jsr.io/@sys/markdown/0.0.23/src/m.Markdown/t.ts),
  [Markdown exports](https://jsr.io/@sys/markdown/0.0.23/deno.json),
  [YAML 0.0.206 types](https://jsr.io/@sys/yaml/0.0.206/src/m.core/t/t.lib.ts), and
  [YAML exports](https://jsr.io/@sys/yaml/0.0.206/deno.json).
- Installed upstream evidence: `node_modules/parse5/package.json` identifies 8.0.1. Read
  `dist/index.{js,d.ts}`, `dist/tree-adapters/default.{js,d.ts}`,
  `dist/tree-adapters/interface.d.ts`, parser options/construction/template insertion, tokenizer
  attribute handling and preprocessing, `dist/common/{token,error-codes}.d.ts`, and serialization.
  Runtime dependency: entities ^8.0.0, installed 8.1.0.
- Templates inspected: `code/-tmpl/-templates/tmpl.pkg/-deno.json`, its common libraries, and
  `tmpl.m.mod/{t.ts,mod.ts}`. The package template's /fs, /ui and demo scaffolding do not belong in
  this kernel. Do not retain them merely because the generator supplies them.

These are source/contract observations, not proof of the proposed package's runtime or size.

## Proposed exports and types

Only `.` → `src/mod.ts` and `./t` → `src/types.ts`. Root exports `Html`, generated `pkg`, plus the
conventional type-only `t` namespace. No /core, /parse5, /browser, /server or /types. Use
`src/m.Html/{mod.ts,m.Html.ts,t.ts,m.Is.ts,common.ts}` with the normal package common/type plumbing;
`mod.ts` is wiring and `m.Html.ts` owns the parsing library. Add utility files only if implementation
actually needs them. Freeze `Html` and `Html.Is`.

Approved type spine; the capability implementation and verification evidence are recorded below:

```ts
import type {
  DefaultTreeAdapterMap,
  DefaultTreeAdapterTypes as Tree,
  ParserError,
  ParserErrorHandler,
  ParserOptions,
  Token,
} from 'parse5';

/**
 * HTML parsing with parse5's default tree representation.
 */
export declare namespace Html {
  /** Synchronous parsing and default-tree narrowing. */
  export type Lib = {
    parse(source: string, options?: ParseOptions): Document;
    readonly parseFragment: ParseFragment;
    readonly Is: IsLib;
  };

  /** Document, not a browser DOM Document. */
  export type Document = Tree.Document;
  export type DocumentFragment = Tree.DocumentFragment;
  export type Node = Tree.Node;
  export type ParentNode = Tree.ParentNode;
  export type ChildNode = Tree.ChildNode;
  export type Element = Tree.Element;
  export type Template = Tree.Template;

  /** All upstream options, specialized to the default tree shape. */
  export type ParseOptions = ParserOptions<DefaultTreeAdapterMap>;

  /** Preserve both upstream fragment forms, including context semantics. */
  export type ParseFragment = {
    (source: string, options?: ParseOptions): DocumentFragment;
    (context: ParentNode | null, source: string, options: ParseOptions): DocumentFragment;
  };

  /** Narrow known default-tree nodes; not validators for arbitrary unknown values. */
  export type IsLib = {
    element(node: Node | null | undefined): node is Element;
    template(node: Node | null | undefined): node is Template;
  };

  export type Attribute = Token.Attribute;
  export type Location = Token.Location;
  export type ElementLocation = Token.ElementLocation;
  export type ParseError = ParserError;
  export type ParseErrorHandler = ParserErrorHandler;
}
```

The abstraction is ownership and narrowing, not a new tree or error schema. All aliases retain
upstream identity. The default adapter creates caller-owned mutable trees: an explicit interop
exception, not shared observable state. Do not cast them to immutable snapshots or deep freeze them.
Readonly library members do not imply readonly parser output. Supplied adapters and callbacks own
their effects; the wrapper cannot promise purity or fresh allocation for arbitrary caller code.

Keep all four options: `scriptingEnabled`, `sourceCodeLocationInfo`, `treeAdapter`, `onParseError`.
The adapter option accepts implementations of the same default-tree contract; no arbitrary
alternate-AST generics in v1. This specialization keeps every current caller and guard on one
representation without dropping an option. A disjoint custom AST would require a separately reviewed
generic contract, not an `as` assertion or an untyped forwarding escape hatch.

Keep parse operations as upstream delegates; no catch/wrap, cloning, input defaulting, option
filtering, or invented overload. In 8.0.1 the context overload requires the third options argument
in its declaration, even though its JavaScript tolerates omission. Preserve the declaration; callers
can pass `{}`. Do not derive this overload with `Parameters`/`ReturnType`.

`Is.element` delegates to the default adapter after a standard `Is.nil` guard. `Is.template`
additionally requires the HTML namespace and template tag. Use the local common lane and `@sys/std`
guards, not ad-hoc unknown-object validators. No generic `walk`, `attribute`, source editor,
serializer, sanitizer, stream API, public adapter object, Parser or Tokenizer runtime export.
Serialization has no current caller; if later earned, distinguish inner from outer serialization.

## Contracts that must survive extraction

- **Recovery, not validation:** parse returns the recovered tree. Diagnostics retain upstream code
  and coordinates; no invented severity, message, success boolean or diagnostic collection. A caller
  may collect them or throw. Callback exceptions propagate unchanged, preserving Vite's
  duplicate-attribute refusal. Do not make every recoverable parse error fatal.
- **Defaults and cost:** scripting defaults true; locations default false; error callback defaults
  null. In 8.0.1 a non-null `onParseError` forces locations on, even if the location option is
  false. Do not install an invisible collecting callback or claim diagnostics are allocation-free.
- **Context:** document parsing may synthesize html/head/body. Context-free fragments use a
  synthetic HTML template context upstream, not an arbitrary div. Explicit table, text and foreign
  contexts matter. Fragment offsets address the supplied fragment string, not its context source.
- **Templates and namespaces:** HTML template descendants are in `content`, not `childNodes`.
  SVG/MathML and HTML integration points retain their identities. A tag name alone does not imply
  HTML semantics. Guard inputs are trusted parser-shaped nodes, not DOM nodes or schema validation.
- **Source positions:** offsets are zero-based UTF-16 string indices with exclusive ends, not byte
  offsets. Line/column coordinates are upstream one-based values; diagnostics can carry fallback -1
  positions. Locations may be absent or null for roots, implied nodes and template content;
  start/end tags and attribute spans are not guaranteed. Location options do not justify non-null
  types.
- **Interpretation versus spelling:** attribute values are decoded; names, namespaces and prefixes
  remain upstream data. Spans refer to the exact original input, including entities and CRLF.
  Recovery can move nodes; a tree is not a lossless token tape or a complete source-edit map. Tree
  edits do not update original offsets. Keep the input string alongside any later edits.
- **Trust:** the default engine does not fetch resources or execute parsed scripts. This is not
  sanitization or a promise of browser-version parity. Do not infer safe DOM insertion from a tree.
  Preserve Vite's static-select and declarative-shadow refusals; coverage expansion is separate.

## Browser hello world: decoded value and original spelling

Approved browser example, now exercised by the local Deno/Chrome proof below. This is not evidence
of a published package import:

```ts
import { Html } from '@sys/html';

const source = '<a href="/hello?x=1&amp;y=2">Hello</a>';
const node = Html.parseFragment(source, { sourceCodeLocationInfo: true }).childNodes[0];
if (Html.Is.element(node)) {
  const href = node.attrs.find((attr) => attr.prefix === undefined && attr.name === 'href');
  const span = node.sourceCodeLocation?.attrs?.href;
  console.info(href?.value); // → /hello?x=1&y=2
  if (span) console.info(source.slice(span.startOffset, span.endOffset));
  // → href="/hello?x=1&amp;y=2"
}
```

## TMIND disposition: three adversarial viewpoints

This is a three-viewpoint review in this session, not three independent external reviews.

1. **API consumer:** a renamed export bag adds little; an AST framework adds unused concepts. Accept
   the owner only with immediate migration, direct aliases and earned template narrowing. Reject
   speculative serialization/walking. Prove real caller types and both fragment forms.
2. **Parsing/source correctness:** catching callbacks weakens refusal; traversing template children
   misses inputs; serialization loses spelling. Preserve exceptions, namespace-aware content and
   offsets. Owner fixtures and unchanged Vite raw-string/refusal assertions close these risks.
3. **Runtime/dependencies:** server tests and relative-import scans can conceal Node dependencies.
   Prove the resolved graph and real browser execution separately. Measure the payload against
   direct parse5; a tiny wrapper is not evidence of a tiny parser.

DMIND reduction: interpret HTML text, not resource policy. Keep simple calls direct and context
explicit. S-tier acceptance requires the file-by-file residue review, not just favorable design.

## Implementation commit boundaries

### Scaffold

`chore(html): scaffold the HTML package - @sys/html`

Human-led template scaffold at `code/sys/html`, then joint structure review. Only the reviewed
kernel and minimal test/example support remain; no accidental /fs, /ui, React or CLI surfaces. This
item establishes package layout, exports and task authority, not parser behavior or migration.

### Capability

`feat(html): expose HTML parsing contracts`

- Write the type spine, then fulfill it. Route upstream dependencies through the owning module's
  common lane. Keep the public ./t purely type-only and avoid runtime imports for type derivation.
- Own the type/surface, parser, positions, universal-entry and footprint proof below, including
  owner-level tests and the browser example. Review this item's files for residue independently.
- Promote parse5 from dev-only classification in both relevant `deps.yaml` sections to a runtime
  dependency; preserve parse5 8.0.1 and the existing resolution. Generate dependency and workspace
  metadata through their owners. Root `prep` and even `prep:imports` have broad submodule/template
  effects (`-scripts/main.ts`, `-scripts/task.prep.ts`); inspect effects and authority before
  running. Do not hand-patch generated files, run global formatting, or infer Git authority from a
  prep task.
- Leave existing Vite call sites unchanged in this commit. Prove the capability before adopting it.

### Adoption

`refactor(driver-vite): migrate HTML parsing to @sys/html`

- Depend on the completed capability item. In Vite, expose Html only through
  `m.HtmlIntegrity/common.ts`, and its type namespace through `src/common/t.ts`. Do not add a parser
  runtime import to the driver-wide common libraries.
- Replace direct parse5 imports and parse/guard calls in both inventoried files, including tests.
  Use narrowed `node.content` instead of `tree.getTemplateContent(node as Template)`. Leave
  attribute lookup and traversal order local.
- Keep resource coverage, URL ownership, input/output phase policy, Vite hooks, hashing, credential
  policy, and MagicString editing unchanged. Do not replace insertion with serialization or merge
  input/output traversal. Existing plugin public types and opt-in behavior do not change.
- Own the consumer proof below and the final cross-package import/residue review. Establish that
  first-party consumers no longer import parse5 directly; do not weaken existing assertions.

Adoption is the immediate successor commit, not optional follow-up work. Both capability and
adoption are required to complete this extraction; splitting them separates their proof boundaries.

## Verification and runtime cost

Use owner-level tests with fixed expected outcomes, not merely wrapper/upstream equality. Direct
upstream comparison may supplement those tests inside @sys/html; it must not remain in consumers.

- **Type/surface:** root identity and frozen library objects; isolated ./t with no runtime edges;
  both fragment signatures; nullable guard inputs; preserved type identities and all four options. A
  compatible adapter forwards unchanged; a disjoint adapter is rejected by the v1 type contract.
- **Parser:** document versus fragment; empty input; context-sensitive table and textarea fragments;
  HTML template content and foreign lookalikes; SVG/MathML integration; scripting/noscript behavior;
  decoded attributes and prefixes; duplicate-attribute recovery and exact thrown-callback
  propagation.
- **Positions:** locations off/on and callback-implied activation; missing/null implicit-node spans;
  absent end tags; source slices with CRLF, astral characters, entities, uppercase and unquoted
  attributes, including trailing slash data. Prove fragment offsets against the fragment input.
- **Consumer:** preserve all pure integrity tests and real Vite build tests, then the existing
  browser loading/select/shadow capstone via `deno task test:integrity`. Preserve expected bytes,
  messages, idempotence and independent disk-based hash verification. No weakened assertions to get
  green.
- **Universal entry:** execute the same hello world via Deno and a real browser build without Node
  shims. Record exact runtime/browser versions; do not claim Node/Bun support without running them.
  Add the repo's `EsmAssert.runtimeGraphBoundary` check, but supplement it with the fully resolved
  bundle graph: its `u.runtimeGraph.ts` scanner follows only relative static imports. Reject Vite,
  MagicString, fs/CLI/UI, Node builtins and parse5 stream packages in the shipped graph.
- **Footprint:** build the same example against Html and direct parse5 using identical tool/version,
  target, minifier and settings; record emitted JS bytes, gzip and Brotli sizes and included
  modules. Parser/tokenizer and entity tables are real cost; the upstream root also re-exports
  serialization. Tree shaking is a measured result, not a guarantee. Avoid unsupported upstream deep
  imports. Compare no-location versus location/diagnostic runs if reporting parse-time or allocation
  claims.
- **Residue:** inspect every changed file, generated delta and import edge. Re-search all
  first-party parse5 imports (including tests/types); only the HTML owner may depend directly on it
  unless an exception is explicitly agreed. Remove stale casts, scaffold stubs, unused exports and
  misleading safety/size/immutability claims. Preserve unrelated work; no workspace-wide cleanup.

Existing verification surface, from `code/sys.driver/driver-vite`:

```sh
deno task test:unit --trace-leaks ./src/m.vite.plugins/m.HtmlIntegrity/-test/-u.htmlIntegrity.test.ts
deno task test:integrity:build
deno task test:integrity
deno task check
```

Bind new-package check/test/browser tasks during scaffold review, before invoking them. Browser
fixture tooling belongs to tests/examples, not runtime exports. Inspect launcher requirements and
stop on a missing tool or denied permission; do not disable browser sandboxing or type checking.

## Observed verification and design approval

The first command above was attempted during this review and exited 1 at type checking; no tests
executed. Four design-stage Vite/filesystem contract errors were reported:

- `code/sys.driver/driver-vite/src/m.vite/t.ts:77`: `Pkg.Dist.Compute.Manifest` is absent.
- `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts:99`: `dist` is not on every Compute response.
- The same file at lines 100 and 172: `manifest` is absent from the response.

`code/sys/fs/src/m.Pkg/t.ts` instead defines a computed/failed union and `manifestChecksum`. No
source was changed or check bypassed in that design review. The consumer baseline was subsequently
re-established before adoption, as recorded below. At the design stage no capability proof existed;
the subsequently executed owner and adoption proofs are recorded below.

Human-approved DMIND decisions for the implementation items:

1. Accept @sys/html ownership and only . / ./t exports.
2. Accept the default-tree specialization, all four upstream options, raw recovered-tree returns,
   and explicitly mutable upstream interop rather than a new immutable AST or result envelope.
3. Accept the four earned operations (parse, parseFragment, Is.element, Is.template), unchanged
   consumer policies, and no serializer/walker in v1.
4. Accept the bounded verification scope and measured-cost reporting, without a fabricated browser
   size target or unproved cross-runtime claim. An unavailable proof blocks the corresponding claim.

Gate authority is the human's explicit approval of these decisions in /sys, recorded here with its
resolution evidence. The review and this design-file update do not satisfy the gate. Rejection means
revise the design, not scaffold around the disagreement. Planning, testing and approval do not
authorize Git mutation; execute only separately requested Git actions.

Resolution evidence: the human explicitly approved the current design in this conversation with
“approved - check it off then”, following the request to approve the design and mark the gate
complete. This accepts all four decisions above and resolves the gate. The accompanying readiness
request concerns `chore(html): scaffold the HTML package`; it does not authorize scaffolding.

## Capability implementation evidence

The human subsequently authorized `feat(html): expose HTML parsing contracts` with “GO”. The type
spine was authored before its implementation. The first owner-test run failed on the absent Html
export; subsequent owner-test runs passed. Vite adoption is a mandatory successor.

- Runtime: frozen `Html` and `Html.Is`, direct parse delegates, null-safe adapter element narrowing,
  and namespace-aware template narrowing. No second AST, parser policy, serializer or walker.
- Types: direct upstream aliases, all four options, both exact fragment overloads and default-tree
  specialization. `./t` emits no JavaScript or runtime dependency edges. Trees stay mutable.
- Metadata: parse5 stays 8.0.1, promoted from dev to runtime in both `deps.yaml` projections.
  Added `prep:deps` invokes `Workspace.Prep.Deps.sync` without broad template/submodule prep;
  generated `package.json` moves only parse5. Import map and lockfile are unchanged. The existing
  `prep:graph` owner regenerated `deno.graph.json`: its graph change is the std → html dependency
  and corresponding order, plus generated timestamps/hash. `check:graph` then passed.
- Documentation: matching “HTML parsing primitives.” description in README/config/root JSDoc,
  actual parsing example, recovery/location/trust contracts and measured browser proof. JSR's
  separately managed registry description was not changed.

Initial capability proof, executed from `code/sys/html`:

- `deno task check` — passed, including proof fixtures.
- `deno task test --trace-leaks` — 6 suites, 24 steps, zero failures.
- `deno task test:browser` — one integration step passed: identical public-Html and direct-parse5
  examples executed in Deno and sandboxed Chrome, against fixed expected values. No empty-page
  success, Node globals/shims, forbidden resolved graph dependencies or emitted external imports.
- `deno task dry` — publish simulation passed, including public API/slow-type checks; not published.

After the bounded test-organization cleanup, exact-file formatting, lint, affected tests,
`deno task check`, full `deno task test --trace-leaks` and `git diff --check` passed. The final owner
suite reported 8 suites, 30 steps, zero failures. The final fixture/tree extraction changed only
tests; the browser proof was not rerun after that extraction.

Scoped source lint, exact-file formatting checks and `git diff --check` were also run. Tool versions,
settings, included-module observations and repeat instructions live in
`code/sys/html/src/-test.browser/README.md`. Observed Html/direct-parse5 emitted sizes respectively:
184,151/177,673 bytes, gzip 45,706/43,845, Brotli 39,520/37,846. The serializer module appears in
both rendered-module lists; no “tiny parser”, maximal tree-shaking, parse-speed or Node/Bun claim.

Capability residue review (same-session review, not independent reviewers):

- Reviewed every added/changed package file and generated delta. Module common owns upstream
  runtime imports; the package common lane retains only the used `Is`. Public exports stay . / ./t.
- Owner tests use fixed tree/diagnostic/source-slice expectations, not just upstream equality.
  Type assertions and the actual bundled type entry cover distinct contract/runtime boundaries.
- Browser/build/compression tooling remains in explicit proof fixtures and its separate task.
  The resolved graph audit supplements, rather than overclaims, the relative-import scanner.
- Capability-stage cross-package search found exactly the two inventoried Vite direct imports
  outside the HTML owner. They were intentionally untouched for the mandatory adoption item, not
  waived.
- Canonical templates, Vite source/tests and unrelated dirty plans were preserved. No discarded
  alternate type-entry fixture or generated module stub remained. Capability evidence did not
  establish consumer proof; the adoption-stage baseline and proof are recorded below.

## Adoption implementation and verification evidence

The human authorized `refactor(driver-vite): migrate HTML parsing to @sys/html` with “GO”. Before
changing the consumers, `deno task test:integrity` passed: 11 tests, 186 steps, zero failures,
including written-build and Chromium loading/select/shadow proofs. This re-established the consumer
baseline after the independently owned Vite/filesystem contract changes.

- Wiring: `m.HtmlIntegrity/common.ts` owns the public Html runtime export; `src/common/t.ts` exports
  the isolated Html type namespace. Driver-wide runtime common libraries are unchanged.
- Consumers: both inventoried files use Html parsing and element narrowing. Template narrowing uses
  `Html.Is.template` and `node.content`, removing the upstream adapter import and Template cast.
  Parser options, callbacks, traversal order, attribute lookup, policies and MagicString edits are
  unchanged; test expectations and independent disk-based hash verification are preserved.
- Metadata: the existing `prep:graph` owner refreshed `deno.graph.json`. Its only graph-content delta
  records Html as a Vite prerequisite; generated timestamps/hash also changed. Package order,
  dependency projections and import map are unchanged.

Executed from `code/sys.driver/driver-vite` after migration:

- `deno task check` — passed.
- `deno task test:integrity` — 11 tests, 186 steps, zero failures, including real Vite builds and
  Chromium loading/select/shadow proofs (HeadlessChrome 154.0.0.0; Vite 8.3.2; Rolldown 1.2.12).
- `deno task test:unit --trace-leaks` — 61 tests, 505 steps, zero failures.

Exact-file formatting and lint checks passed for all four changed TypeScript files. Root
`deno task check:graph` and `git diff --check` passed after graph generation. `test:unit` excludes
integrity build proofs; use the declared `test:integrity:build` or the complete `test:integrity`
lane rather than passing the excluded build file to `test:unit`.

Adoption residue review (same-session review): all four source deltas and the generated graph delta
were inspected. A first-party source search, including ignored code while excluding
third-party/build/cache copies, found parse5 references only inside the HTML owner. No upstream
adapter accessor, Template cast, driver-wide parser runtime export, weakened expectation or Vite
policy change was introduced. Canonical templates and unrelated work were preserved.
