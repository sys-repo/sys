# Memory Cell — STIER chew on `@sys/cell`

## Status
Single active design note.

This note is the canonical live chew for the Memory Cell idea.
Do not maintain a second copy under `code/sys.dev/-agent/`.

`@sys/cell` is the strongest current candidate, but not yet a package landing decision.
The concept layout is now considered landed enough to use as the design baseline before implementation decomposition.

## XHIGH concept layout — landed baseline
The landed conceptual layout is:

```text
Cell
├─ dsl       late-bound medium
├─ runtime   active interpreter
└─ view      bound lens / managed artifact
```

This layout is the baseline.
Do not decompose implementation work from older seams like `memory/document` or `projection/runtime`.
Those signals have been preserved inside the tighter seams:

- `memory/document` survives inside `dsl`
- `projection` survives as a `runtime` operation
- Vite/static bundle survives inside `view`

The Cell loop is:

```text
dsl → runtime → view → runtime → dsl
```

Meaning lives in `dsl`.
Active transformation lives in `runtime`.
Perception and editing live in `view`.
Writes return through runtime validation into `dsl`.

The metamedium claim is grounded in this loop:
- the folder is the medium
- the runtime interprets it
- the view lets humans/agents perceive and edit it
- the validated write-back keeps the medium alive instead of fossilized in the bundle

This layout is independent of final package placement.
Package placement remains open, with `@sys/cell` the strongest candidate.

## Pure essence / no-drift formulation
No new primitives are needed.
The power is in the exact composition of existing ones.

A Cell is the minimal local metamedium loop:

```text
files → interpreter → lens → validated write-back → files
```

Mapped to the landed seams:

```text
dsl      = files as late-bound medium
runtime  = interpreter over that medium
view     = lens onto that medium
```

Mapped to existing system substrates:

```text
dsl      = @sys/schema + @sys/yaml + Markdown/files + help map
runtime  = @sys/http/server + Deno ESM + validation/write-back
view     = @sys/driver-vite + dist.json + optional @sys/tools/pull
```

Mapped to operator affordances:

```text
@sys/tools/pi      active agent harness over the Cell
@sys/tools/pull    optional view artifact acquisition/update
@sys/tools/serve   possible friendly door, not the core runtime
```

The Cell itself remains the small grammar that binds them.

### No-drift invariants
- Truth stays in the folder, not in the view.
- Turing-complete behavior stays explicit in runtime, not hidden in magic.
- The view is a replaceable artifact, not the app.
- `--help` is the first map, not optional discovery.
- Agent writes are schema/runtime validated before closeout.
- Pull/serve/pi are loose operator affordances, not Cell ownership.
- The implementation should feel boring if the concept is right.

### TMIND failure checks
If the design starts to look like a framework, stop.
If Stripe becomes the model instead of the first proof view, stop.
If Pi becomes the owner instead of a harness, stop.
If Vite becomes the center instead of one bound-lens substrate, stop.
If YAML becomes untyped config instead of a TypeScript/schema-backed carry surface, stop.
If the runtime hides file truth behind opaque state, stop.

## Long-range alignment — why `Cell` earns the name
The long-range system diagrams are not feature maps.
They are invariant maps:
- perception and I/O
- typed conversation
- local memory and resilient state
- active runtime and message passing
- distribution, namespace, and trust
- cell division into package/repo/workspace forms

The Cell layout matches those invariants structurally, not metaphorically.

```text
Cell
├─ dsl       late-bound medium
├─ runtime   active interpreter
└─ view      bound lens / managed artifact
```

Mapping:
- `dsl` carries local memory, schemas, help maps, written state, and typed intent.
- `runtime` carries computation, command/event response, dynamic binding, validation, and write-back.
- `view` carries perception, attention, conversation UI, and replaceable lenses.
- `dist.json` / `@sys/tools/pull` carry distribution and managed artifact provenance.
- `@sys/tools/pi` carries an active conversational harness over the same local medium.
- `@sys/tmpl/pkg` and `@sys/tmpl/repo` are Cell-division proof-worlds, not separate metaphysics.

This is why `@sys/cell` is the right name when the package is earned.
It does not name one product feature.
It names the smallest local unit that can express the whole system shape.

S-tier precision:
- Cell is **not** "all of it" as a central framework.
- Cell is "all of it" as a generative primitive: the smallest addressable local medium from which the other shapes can be grown.

So the strong claim is:

> A Cell is the local, writable, interpretable unit of the @sys metamedium.

That is powerful enough to deserve the name only while the implementation stays small:
- files remain truth
- runtime remains explicit
- views remain replaceable
- operator tools remain loose
- validation protects write-back
- composition beats ownership

## Core question
The landing place will shape the concept.

If it lands under a driver, it becomes driver-shaped.
If it lands under tools, it becomes CLI-shaped.
If it lands under dev, it becomes harness/WIP-shaped.
If it lands as `@sys/cell`, it must earn primitive shape.

The live question is:

> Is Cell a true @sys primitive, or only a convenience composition around existing primitives?

## Current STIER read
Keep chewing on `@sys/cell`.
Do not scaffold yet.

`@sys/cell` is plausible because no existing package truthfully owns the whole composition:
- `@sys/driver-vite` owns Vite/bundle truth, not memory semantics
- `@sys/http` owns server truth, not document/runtime memory
- `@sys/yaml` and `@sys/schema` own document/validation truth, not UI/runtime serving
- `@sys/tools/pi` may consume Cells, but must not define them
- `@sys/dev` is too overloaded and risks dev-harness gravity

A top-level package is justified only if the Cell contract remains crisp, durable, and irreducible.

## Candidate contract
A concise package-level sentence:

> A Cell is a directory-local medium whose files remain late-bound through an explicit runtime/interpreter and a replaceable view lens.

A more concrete implementation sentence:

> A Memory Cell is a directory-local, schema-backed memory runtime that binds structured DSL files, written Markdown memory, optional Deno methods, and a bundled UI lens.

These sentences must survive review before `@sys/cell` is earned.

## Main surface seams
The better top-level fusion is:

```text
dsl      = late-bound meaning and memory substrate
runtime  = active interpretation and response
view     = bound lens / managed artifact
```

This keeps the good part of the earlier model without preserving its fuzziness.

The old `memory/document` seam was right to protect the fact that the files are the medium.
The new `dsl` seam should not erase that.
It should absorb it: DSL means typed contracts, YAML/JSON carry documents, Markdown corpus, help map, write rules, and validation loop.

The old `projection/runtime` seam was right to name active transformation.
The new `runtime` seam should not flatten that into static serving.
It should absorb it: runtime means server, compiler-like transforms, local Deno methods, validation, projection, lifecycle, and controlled rewrite.

### 1. DSL seam
The DSL seam is late-bound meaning plus memory substrate.

It owns:
- TypeScript/TypeBox schema authority
- YAML/JSON carry instances
- Markdown written memory corpus
- help map / `--help` entrypoint
- data-store declarations
- read/write path policy
- preservation rules
- migration/version rules when earned
- examples only when they clarify valid state
- validation feedback for agent write loops

The type authority should be TypeScript first.
YAML is the legible carry substrate, not the type authority.

A human may edit YAML directly, but the expected high-leverage path is often agent-mediated:
- human expresses intent in Pi/Codex/chat
- agent opens the help map
- agent reads the TypeScript/TypeBox schema
- agent edits YAML/JSON/Markdown carry state
- runtime validation checks the instance immediately
- agent repairs until the Cell is valid

The schema is therefore part of the Cell's UI for agents:
- compact
- typed
- inspectable
- feedback-producing
- cheaper than re-reading narrative context for every edit

The DSL seam can describe:
- policy
- document shape
- available views
- data indexes
- runtime entrypoints
- agent affordances
- write/rewrite constraints

The Markdown corpus remains load-bearing:
- notes, logs, briefs, decisions, plans, fragments
- optional YAML frontmatter
- durable human/agent written state
- parsable/indexable/projectable when needed

Memory Cell is not "JSON state with UI."
It is a simple directory whose files are the medium, with DSL contracts that make the medium operable.

### 2. Runtime seam
The runtime seam is active interpretation and response.

It must be disambiguated from the view seam.
The view is the bound lens.
The runtime is the authority that runs beside or behind the files and turns the folder-medium into served, queryable, writable behavior.

It can contain:
- HTTP server lifecycle
- static serving of the view artifact
- DSL/document read projection
- Markdown corpus parsing/indexing
- compiler-like transforms from files into servable output
- schema validation
- semantic validation when explicitly supplied
- validated write-back
- controlled rewrite actions
- Deno ESM callable methods

This is where Turing-complete behavior may exist.
But it must be explicit, local, declared, and policy-bound.

The core Cell runtime should provide the boring host:
- resolve the Cell descriptor
- serve the view
- read/project DSL and memory
- validate writes
- call declared local methods
- return an explicit lifecycle handle

The optional cell-local Deno module provides authored behavior:
- parse Markdown corpus → JSON projection
- derive summaries/indexes from files
- transform YAML/Markdown into servable documents
- compile local content into view models
- validate semantic constraints beyond schema
- perform controlled rewrite actions
- expose typed local commands to `@sys/tools/pi`

Projection is a runtime operation, not the name of the seam.

### 3. View seam
The view seam is bound perception and managed artifact.

It contains:
- prebuilt Vite artifact
- static browser bundle
- replaceable/rebuildable UI shell
- optional remote bundle source
- `dist.json` manifest/provenance

The view is not truth.
It is a lens over truth.

The browser bundle may contain JavaScript, but in the Cell model it remains the view artifact:
- renders
- visualizes
- edits
- calls APIs
- can be replaced without destroying memory

The view consumes runtime projections and writes back through validated runtime paths.
It must not become the source of truth.

The view can be bound in two equivalent ways:

1. **Shipped local bundle**
   - Cell carries `dist/` in the folder
   - `dist/dist.json` records manifest/provenance
   - works offline and is fully local

2. **Managed pulled bundle**
   - Cell declares a remote `dist.json` source
   - `@sys/tools/pull` can fetch/swap/update the local view bundle
   - the pulled artifact still lands as a normal local `dist/` view

This is not an enhancement bolted on later.
It is part of the view seam.

A Cell may choose:
- stable bundled view
- late-bound view pulled from a manifest
- shipped default plus optional upgrade path
- multiple named view bundles later, if earned

The standard `dist.json` package-manifest pattern is the right provenance boundary for bound views.
It lets the Cell keep the view replaceable without making the DSL/runtime depend on one compiled artifact.

## Candidate filesystem grammar
Smallest structured-data Cell:

```text
<cell>/
├─ cell.yaml
├─ data.yaml
└─ dist/
```

Smallest Memory Cell with written corpus:

```text
<cell>/
├─ cell.yaml
├─ data.yaml
├─ memory/
│  └─ *.md
└─ dist/
```

Smallest active Cell with Deno callable behavior:

```text
<cell>/
├─ cell.yaml
├─ data.yaml
├─ memory/
│  └─ *.md
├─ cell.ts
└─ dist/
```

Possible later grammar:

```text
<cell>/
├─ cell.yaml
├─ data.yaml
├─ data.schema.json
├─ memory/
│  ├─ index.yaml
│  └─ *.md
├─ cell.ts
├─ dist/
└─ .cell/
   └─ cache/
```

Do not start with `.cell/` unless needed.
The visible files are part of the product.

File roles:
- `cell.yaml` → descriptor/policy/DSL
- `data.yaml` → structured live state
- `memory/*.md` → written memory corpus
- `cell.ts` → optional local Deno interpreter/actions
- `dist/` → bound Vite view artifact

## Candidate `cell.yaml`
Illustrative, not final:

```yaml
kind: cell
version: 1

view:
  dist: ./dist
  manifest: ./dist/dist.json
  source:
    kind: http
    dist: https://example.com/cell-view/dist.json

data:
  path: ./data.yaml
  format: yaml
  schema: ./data.schema.json

memory:
  dir: ./memory
  format: markdown

runtime:
  module: ./cell.ts

server:
  routes:
    cell: /-/cell
    data: /-/data
    schema: /-/schema
```

Important distinction:
- `cell.yaml` is descriptor/policy
- `data.yaml` is structured state
- `memory/*.md` is written memory
- `cell.ts` is optional local active behavior

Do not collapse these too early.

## Candidate HTTP contract
Keep it tiny:

- `GET /` → UI artifact
- `GET /-/cell` → resolved descriptor projection
- `GET /-/data` → current data/projection as JSON
- `GET /-/schema` → schema when configured
- `PUT /-/data` → validate and replace source document or declared projection target

Defer:
- patch semantics
- websocket/SSE
- history
- multi-document cells
- auth
- plugin routes

Projection is an operation the runtime performs.
It is not the third plane.

## Candidate API surface
The first API should be one noun and one obvious action:

```ts
Cell.serve(...)
```

It should return an explicit lifecycle handle.
The exact type is not settled.

The implementation should own:
- config resolution
- static bundle binding
- structured data read projection
- Markdown corpus read/projection when configured
- optional Deno ESM runtime loading
- schema validation
- validated write-back

It should not own:
- Vite build policy beyond accepting an artifact path
- app-specific commands unless explicitly supplied by `cell.ts`
- document semantics beyond schema validation and declared local runtime methods
- UI state logic

A second surface may be earned later:

```ts
Cell.load(...)
```

This would resolve a Cell directory without serving it, useful for tools and Pi.
Do not add it until the serve path proves the type shape.

## Kay / metamedium mapping
This is not a pivot.
It is the deeper reason the Cell shape matters.

The folder is the medium.
The UI, Deno runtime, and Pi/agent harness are active interpreters over that medium.

### 1. Metamedium distinction
A normal app fixes the medium early.
A Cell does not.

A Cell directory can simulate many concrete media:
- profile editor
- journal
- planning room
- payment harness
- schema-backed form
- agent workspace
- explorable notebook

These are grown from files, not hardcoded into a locked app.

### 2. Active response
A Cell is not passive content.

It can answer through:
- HTTP projections into the UI
- Deno ESM methods
- schema diagnostics
- Pi/agent rewrite passes
- live parsing of the Markdown corpus

This is where "think with you" enters the design.
The Cell is a local medium that can respond to queries and experiments because the runtime is close to the files and the files remain editable.

### 3. Late binding
Late binding is the technical heart.

Meaning is not frozen into the bundle.
Meaning stays in the folder until interpreted by:
- schema
- server projection
- UI view
- Deno runtime method
- agent pass

The Vite bundle is bound behavior.
The YAML/JSON/Markdown corpus is late-bound meaning.
The server and ESM runtime are the bridge.

Engineering rule:

> Do not fossilize meaning in the compiled artifact when it can remain inspectable and rewritable in the Cell directory.

## Schema-anchored agent writes
A Cell should never be left in an invalid DSL state.

This implies a write loop, not a best-effort edit.

The canonical agent write path should be:

```text
intent → inspect help map → inspect TypeScript/TypeBox schema → edit carry document → validate → repair until valid → persist
```

The schema must be available to the agent in a compact, concrete form.
Prefer TypeScript/TypeBox as the authoritative shape, with YAML/JSON as instances.

Why this matters:
- the agent can reason from types instead of prose guesses
- validation feedback is tight and cheap
- invalid intermediate proposals do not become persisted Cell state
- the DSL remains evolvable without making the agent infer rules from examples alone

YAML becomes a human-legible UI over typed state.
But practically, many YAML changes may be authored by agents from conversational intent.
That is good, if and only if writes are schema-anchored and validated before closeout.

S-tier rule:

> Agents may edit Cell DSL/state, but they must validate against the declared schema/runtime rules and repair before leaving the Cell.

## Help map as the agent entrypoint
A Cell should expose one principled agent/human doorway:

```text
--help
```

For a directory medium, `--help` is not an optional CLI afterthought.
It is the canonical map page.

The first move for Pi or any future active interpreter should be:

```text
open/read the Cell help map
```

Not "maybe look for help."
Not "infer from filenames first."
The help map is the doorway into all other Cell affordances.

This keeps discovery explicit while avoiding artificial limitation.
The help map can point to everything the Cell chooses to expose:

1. **Data stores / content**
   - `data.yaml`
   - `memory/**/*.md`
   - indexes
   - generated/read-only projections

2. **Runtime validation rules**
   - TypeScript/TypeBox schema authority
   - `@sys/schema` runtime validation
   - semantic validation via local runtime methods
   - write constraints
   - preservation rules

3. **Narrative / intent context**
   - why this Cell exists
   - how to make useful edits
   - current goals
   - examples
   - domain vocabulary

This is the Cell equivalent of CLI `--help`, but richer because the medium is a folder.
It is a map, not the territory.
The source-of-truth files remain source-of-truth.

Candidate representations:
- `cell.yaml` declares the help map path
- `Cell.help(...)` or `Cell.load(...).help` resolves it
- a CLI/tool can expose it as `cell --help`
- Pi starts by reading it when operating on a Cell

Example descriptor shape, illustrative only:

```yaml
agent:
  help: ./HELP.md
  read:
    - ./cell.yaml
    - ./data.yaml
    - ./memory/index.md
  writable:
    - ./data.yaml
    - ./memory/**/*.md
  schema:
    - ./data.schema.json
```

S-tier constraint:
- one help map entrypoint
- many linked affordances
- no giant prompt blob
- no hidden discovery magic
- no model-specific instructions as the primary contract

## Relationship to Pi
Pi is a high-value proof-world and likely early consumer.
It is not the owner.

A directory configured for `@sys/tools/pi` can become a Cell because:
- it already has local policy
- the agent can read/write that policy
- the UI can be a structured lens over the same truth
- the folder can expose explicit runtime affordances

Clean relationship:

```text
@sys/cell      local medium/runtime primitive candidate
@sys/tools/pi  active harness/interpreter over a cell
@sys/driver-pi proof-world / possible consumer
```

Pi can rewrite the folder because the folder is intentionally shaped to be rewritten:
- not random files
- not hidden app state
- a configured local medium

## Baseline usage scenario — Stripe Payment Cell
This is the first concrete proof scenario to carry into implementation design.

The view is the existing `@sys/driver-stripe` payment render sample, served from a built `dist/` bundle.
The screenshot proof-world is the current Stripe PaymentElement DevHarness view: dark canvas, PaymentElement card widget, debug panel, and Stripe button.

This scenario is intentionally mundane:
- not a special Stripe framework
- not a custom Cell app
- not Pi-owned
- not Vite-owned

It proves loose coupling that becomes tight only when configured.

### Scenario sequence
1. Operator starts a normal Pi session in a folder:

```sh
sys pi
```

2. Pi initializes the folder with the normal baseline discipline:
- git-aware working directory
- help/map first posture
- local policy files
- no hidden state

3. Pi invokes a new Cell-oriented action or command surface.
The exact command is not designed yet.
Conceptually:

```text
make this folder a Stripe payment Cell
```

4. The action writes/configures the Cell DSL:
- choose the Stripe PaymentElement view bundle
- declare the view as a managed artifact
- add minimal payment widget config/state
- declare schema/runtime validation
- expose help map and write rules

5. The view is served from `dist/`:
- either shipped with the Cell
- or pulled/swapped/updated through `@sys/tools/pull` from a `dist.json` manifest

6. Runtime serves the view and projects Cell DSL/state into it.
The view renders the Stripe PaymentElement.
Writes or config changes route back through runtime validation.

### Why Stripe is a good first proof
Stripe gives a real, concrete view with real configuration pressure:
- publishable key
- client secret
- theme
- debug/pass-secrets toggles
- widget config
- environment-sensitive behavior

That is enough to prove:
- view artifact can be selected by config
- view artifact can be managed by `dist.json` / pull tooling
- DSL can carry minimal typed state
- runtime can project state into the UI
- Pi can write state from intent
- schema validation prevents invalid Cell DSL/state

### What this scenario must not do
Do not let Stripe own the abstraction.
Stripe is the first view proof, not the Cell model.

The same Cell primitives should later support:
- YAML/Markdown editor
- repo/IDE view
- Pi profile view
- generic schema form view

### Candidate Stripe Cell shape
Illustrative only:

```text
payment-cell/
├─ cell.yaml
├─ data.yaml
├─ data.schema.ts
├─ HELP.md
├─ runtime.ts
└─ dist/
   ├─ index.html
   ├─ assets/...
   └─ dist.json
```

Possible descriptor sketch:

```yaml
kind: cell
version: 1

view:
  dist: ./dist
  manifest: ./dist/dist.json
  source:
    kind: http
    dist: https://example.com/sys/driver-stripe/payment-cell/dist.json

dsl:
  data: ./data.yaml
  schema: ./data.schema.ts
  help: ./HELP.md

runtime:
  module: ./runtime.ts
```

Possible data sketch:

```yaml
payment:
  provider: stripe
  element: PaymentElement
  theme: Dark
  debug: false
  passSecrets: true
```

Secret handling remains a runtime/policy concern.
The scenario should prove shape and validation, not encourage unsafe secret persistence.

## Proof-worlds
A candidate `@sys/cell` needs at least two proof-worlds to fit naturally without special cases.
One world is not enough.

### Pi profile world
`/-config/@sys.driver-pi` proves:
- YAML as human/agent policy
- local directory authority
- schema-shaped operation
- agent-readable memory

### Stripe/dev-shell world
The Stripe dev harness proves:
- Vite artifact can be a bound shell
- live config can be proxied into UI
- runtime can be small

### Generic YAML/Markdown editor world
A YAML/Markdown editor proves:
- the UI can be a structured lens over files
- schema diagnostics can be first-class
- non-Pi, non-Stripe documents fit the same runtime

## Package placement stress matrix

### `@sys/driver-vite`
Rejected.
Vite is only the bound view substrate.

### `@sys/driver-pi`
Rejected.
Pi is only a consumer/proof-world.

### `@sys/tools`
Rejected as primary home.
A CLI may come later, but the reusable seam is runtime/API first.

### `@sys/dev`
Weak candidate / likely rejected.
It carries dev-harness and WIP gravity.

### `@sys/yaml`
Rejected.
YAML is only one memory/document substrate.

### `@sys/http`
Rejected.
HTTP is only one runtime substrate.

### `@sys/cell`
Strong candidate.
Correct if and only if Cell has an irreducible primitive contract.

## Substrate honesty
A high-quality `@sys/cell` must not expose substrate lies.

Rules:
- Vite options are not reinvented
- HTTP behavior is not hidden behind fake abstractions
- YAML/schema parsing uses canonical surfaces
- filesystem paths remain explicit
- lifecycle is explicit
- Turing-complete behavior lives in declared local runtime modules, not hidden package magic

Cell should compose, not mask.

## Naming pressure

### `Memory Cell`
Good as the design/session name.
Emphasizes durable local memory.
May be too narrow for the package if it also serves generic schema-backed documents.

### `Cell`
Strong technical noun.
Implies:
- bounded locality
- self-contained runtime
- live state
- active interpretation
- replaceable view

Risk:
- too metaphorical unless backed by strict filesystem and HTTP contracts.

### Avoid
Avoid primary names like:
- `Harness` — test/dev-only gravity
- `Profile` — Pi-shaped
- `Shell` — UI/container bias
- `App` — broad/framework-shaped
- `View` — UI-only
- `Memory` — storage-only
- `Projection` — mechanism, not the bounded unit
- `Capsule` — packaged artifact bias

## S-tier acceptance for `@sys/cell`
Do not scaffold `@sys/cell` until these are stable:

1. **Contract sentence survives review**
   - directory-local
   - late-bound files
   - explicit runtime/interpreter
   - replaceable view lens

2. **Filesystem grammar is tiny**
   - descriptor
   - structured state
   - optional Markdown corpus
   - optional Deno runtime
   - bundle

3. **HTTP contract is tiny**
   - serve UI
   - read data/projection
   - write data/projection target
   - optional schema/config projection

4. **API surface is tiny**
   - one noun
   - one obvious serve action
   - explicit lifecycle

5. **Substrate ownership is honest**
   - no Vite reinvention
   - no HTTP reinvention
   - no YAML/schema reinvention

6. **At least two proof-worlds fit without special cases**
   - Pi config world
   - Stripe/dev-shell world
   - generic YAML/Markdown editor world

7. **No framework smell**
   - no route DSL in v1
   - no plugin registry in v1
   - no hidden database
   - no app lifecycle abstraction

8. **Turing-complete behavior is explicit**
   - local Deno module
   - declared in `cell.yaml`
   - policy-bound
   - no hidden magic

## Next design work
Before scaffolding anything, reduce the smallest possible contract packet:

1. `cell.yaml` shape
2. data/memory file rules
3. Deno runtime module shape
4. HTTP route contract
5. lifecycle handle shape
6. exact non-goals

Only after that should package placement be finalized.
