# Plan: @sys/model/files + @sys/server/files

## Status

Retired/completed STIER plan.

Phases 1–7 are implemented, validated, and recorded in the phase delivery ledger below with actual
commit hashes. Future composed HTTP/static integration work is tracked separately in:

```text
/Users/phil/code/org.sys/sys/-agent/files-static-http-cmd-integration.plan.md
```

## Essence

`@sys/server/websocket` made the transport primitive small and strong:

```text
Deno WebSocket server mechanics
+ typed @sys/event/cmd algebra
+ service lifecycle/status discipline
= reusable command transport substrate
```

The next unit should not extend the WebSocket primitive. The next unit is a general domain model and
command grammar:

```text
@sys/model/files
```

`@sys/server/files` should surface that model as server/service convenience, not own the canonical
Files grammar.

This means a bounded, permissioned, observable **Files view** whose primary interface is
`Cmd<T>` grammar.

It does **not** mean "the filesystem" and it does **not** mean a generic FS API. It means a bounded
capability over a configured set of files: a root/scope, explicit permissions, safe command handlers,
portable representation, and observability over that set.

## DMIND anchor

The headline is:

```text
Cmd<T> gives a typed IO surface over a bounded Files view.
```

Everything else is transport and representation.

The transports are important but should be elegantly hidden behind the `Cmd<T>`/client surface:

```text
ws                 → live, bidirectional, highest fidelity
http/json:dynamic  → request/response, live reads, no bidirectional watch unless emulated
http/json:static   → snapshot manifest/content refs, export-time policy, no live watch
```

Consumers should learn one files command/client shape first. They should not start by choosing
WebSocket vs REST vs static. Transport selection should explain fidelity, not define the domain.

## Kay stance

This is not “files over WebSocket.” It is a small typed **IO algebra** for a bounded Files view:
one `Cmd<T>` surface that says, with precision, what files are visible, what can be read, what
changed, how fresh the view is, and what authority was used. WebSocket, dynamic HTTP/JSON, static
manifests, S3/IPFS buckets, and pulled caches become fidelity modes under the same conceptual client,
not competing APIs.

The power is that “file there, interact here” becomes a general system primitive. A local Cell can
expose a live folder with watch semantics; the same view can be snapshotted to a static public
endpoint; a browser can consume either through the same Files client and inspect capabilities. The
user model stays stable while the transport changes.

Don't model the network; model the conversation. `Cmd<T>` is the message algebra. Files is the
bounded object world. Transports are different mail systems.

## Distillation of the design point

This is not:

```text
filesystem API over WebSocket
```

It is:

```text
one Files capability model
one primary Cmd<T> IO grammar
multiple transport/distribution surfaces
clear fidelity levels
same client mental model where it matters
```

The browser/client should be able to work against a stable command/client surface:

```text
list
stat
read
watch? / refresh?
manifest?
```

The backing surface determines fidelity, not the shape of the user's mental model.

The design should make transport feel like a capability/fidelity choice:

```text
live WebSocket service     → full live Cmd<T> surface
live HTTP/JSON service     → command-shaped request/response surface
static HTTP/JSON endpoint  → manifest/content projection of the same view
```

## Canonical package home

Keep model, backing, transport, and application projection separate.

Canonical split:

```text
@sys/model/files       → Files<T> model, Cmd grammar, pure schemas/normalizers
@sys/model/files/fs    → readonly filesystem-shaped backing adapter over a precise structural capability
@sys/server/files      → server/service facade over the Files model
@sys/fs                → concrete local filesystem primitives and optional bridge into @sys/model/files/fs
@sys/http              → HTTP/static helpers where needed
@sys/event/cmd         → generic Cmd<T> algebra substrate
@sys/model-slug        → slug/media domain projection above Files
@sys/server/websocket  → generic Cmd-over-WebSocket transport primitive
```

`@sys/model/files` is the source of truth for names and shapes:

```text
Files.StringPath
Files.Entry
Files.Capability
Files.Capabilities
Files.ContentRef
Files.Manifest
Files.Policy
Files.Cursor
Files.Cmd.Name
Files.Cmd.Payload
Files.Cmd.Result
Files.Cmd.Event
Files.Client shape/types
```

It should not perform host IO, start servers, fetch URLs, or import UI. Runtime adapters compose around
it.

STIER distilled architecture:

```text
@sys/model/files
  stable language of the Files conversation

backing adapters
  model-owned readonly files/fs, memory fixture, static dist.json, dynamic HTTP

transport adapters
  WebSocket Cmd, HTTP/JSON command envelope, static GET/pull

projection layers
  slug/media/timecode/UI/CRDT/app models
```

Do not create:

```text
@sys/server/websocket/files
@sys/server/websocket/fs
@sys/server/websocket/file-system
```

Those paths make filesystem semantics look subordinate to the WebSocket transport. Wrong center of
gravity. Files are the domain. WebSocket is one transport.

## Distilled plan

1. Land the pure `@sys/model/files` grammar first.
   - `Files.Cmd` maps
   - `Files.Entry`
   - `Files.ContentRef`
   - `Files.Capability`
   - `Files.Manifest`
   - `Files.Policy`
   - `Files.Cursor`
   - `Files.Client` shape

2. Prove the grammar with tiny essence fixtures.
   - `hello.txt`
   - `foo.json`
   - `bar.yaml`
   - no app-shaped fixtures in primitive tests

3. Add concrete adapters around the model.
   - readonly `@sys/model/files/fs` backing over a precise structural FS capability
   - memory fixture backing
   - optional `@sys/fs` bridge into the readonly files/fs capability
   - WebSocket server facade
   - static `dist.json` reader
   - dynamic HTTP later

4. Keep data-plane and control-plane separate.
   - `Cmd<T>` carries structures: entries, refs, manifests, capabilities
   - body content moves by inline small text, content refs, static GET, or future streams

5. Let higher domains project above Files.
   - slug/media/timecode/UI use Files as stable input
   - JSON UI props are views, not authority
   - CRDT/repo/app semantics sit above or beside this substrate

## Why this matters

A local Cell may run a live WebSocket service over files:

```text
@sys/cell
  starts local WebSocket service
  exposes live files/list/read/watch via Cmd
```

The same bounded files view may also need to become a static/pullable shape:

```text
export allowed fileset
  → manifest/index
  → content refs or blobs
  → static endpoint
  → traditional HTTP pull/load
```

These are not identical capabilities, but they can share one model if fidelity is explicit.

The unifying object is not WebSocket and not REST. The unifying object is the portable **Files view**
addressed through a typed `Cmd<T>` IO surface.

## Relationship to current @tdb.data pipeline

A BMIND scan of `deploy/@tdb.data/src` shows an existing static-data staging pipeline:

```text
authored folders / YAML slug datasets
→ staged mount directories
→ manifests/
→ content/ hash documents
→ mounts.json
→ dist.json
→ browser client loads via HTTP/static endpoint
```

Relevant current pieces:

- `fs/m.DataPipeline/*`
  - `stageFolder(...)`
  - `stageSlugDataset(...)`
  - `refreshRoot(...)`
- `fs/m.cli/*`
  - profile-driven staging CLI
  - mappings such as `folder` and `slug-dataset`
- `m/m.client/*`
  - static/runtime client over `baseUrl`
  - loads tree manifests, content index, hash content
- `m/m.Mounts/*`
  - root mount index contract

This pipeline is already wrestling with files/folders, normalized static data, browser-readable clients,
and pullable/static distribution.

The risk is letting the transpiled/static representation become the conceptual center. The better center
is a permissioned Files view that can project into static staging when needed.

## DMIND lens: @tdb.data authored YAML and media references

BMIND scan points from `deploy/@tdb.data`:

```text
-config/@tdb.slc-data/*.yaml
  → profile/mapping inputs

src/-test/sample-2.yaml.authored/-root.yaml
  → authored dataset root metadata

src/-test/sample-2.yaml.authored/docs/slug.*.yaml
  → authored source documents
  → traits such as media-composition / slug-list
  → alias blocks for :core-assets, :p2p-assets, :core-videos, :p2p-videos
  → sequence items referencing video, image, slug, pause, timestamps, script

src/fs/m.DataPipeline/*
  → current staging/transpiling path
  → reads authored YAML
  → derives tree/content/playback JSON and YAML manifests

public/data/** and dist/data/**
  → static HTTP GET projection
  → manifests/
  → content/sha256-*.json
  → dist.json digest map
  → mounts.json
```

The important design correction:

```text
raw authored YAML is valid Files content
```

It should be possible to move/read/list authored YAML through the `Files.Cmd` algebra directly:

```text
files:list  { match: ['**/*.yaml', '**/*.yml'] }
files:read  { path: 'docs/slug.<id>.yaml', encoding: 'utf8' }
```

Then a domain layer may parse/transpile that YAML into typed JSON structures:

```text
YAML source
  → parse/validate
  → slug tree/content/playback JSON
  → UI config/runtime structures
```

But the JSON projection should not be treated as the only main supply line. It is a projection of the
Files view, not the authority itself.

The transpile step can live in more than one place:

```text
client-side
  read YAML via Files.Cmd
  parse/validate/derive in the browser or local Cell
  fastest design loop, live authoring posture

server-side / Deno Deploy / WinterCG-compatible runtime
  read YAML via Files.Cmd or local backing
  parse/validate/derive on request or build
  good for policy, performance, shared cache

static public internet
  publish JSON/YAML manifests and content refs
  GET/pull only
  no live authority, snapshot fidelity
```

This means `@tdb.data` becomes an excellent stress case without becoming the design center. The Files
primitive should make the authored YAML and media references addressable, portable, and policy-bounded.
Slug-specific parsing, playback derivation, and UI config binding remain higher-domain concerns.

Testing boundary rule:

```text
Do not put @tdb.data-shaped fixtures into the pure transport layer tests.
```

Transport tests should use essence-level fixtures such as `hello.txt`, `foo.json`, and `bar.yaml`.
`@tdb.data` and slug/media-shaped samples belong in adapter/projector tests or design notes. This avoids
coupling the primitive to the first real usage call-sites.

For media, first-land Files should treat video/image paths as file entries or content refs, not invent a
media server. The authored YAML already contains media references like `/:p2p-videos/...webm`; Files can
list/read/manifest the visible files and let a slug/media layer resolve semantics.

Conservative BMIND note: no video binary files were found in the scanned `deploy/@tdb.data` tree. The
signal here is authored YAML that references external media assets through aliases, plus static derived
JSON/manifests that preserve those references.

## Static projection lens: canonical dist.json

BMIND scan points:

```text
@sys/types
  t.DistPkg
  t.CompositeHash
  t.DistPkgHashIgnore

@sys/std/pkg
  Pkg.Dist.fetch(...)
  Pkg.Dist.Part.parse/hash/size(...)
  Pkg.Is.dist(...)
  Pkg.Dist.Compat.toCanonical(...)
```

`t.DistPkg` is already a canonical static distribution manifest:

```text
dist.json
  type
  pkg?
  build.time
  build.hash.policy
  build.hash.ignore?
  hash.digest
  hash.parts[path] = sha256-...:size=<bytes>
```

TMIND assessment: this is likely enough for a first static `Files` capability adapter.

```text
Files.Static.fromDist(origin)
  → Pkg.Dist.fetch({ origin, pathname: 'dist.json' })
  → validate t.DistPkg
  → derive entries from dist.hash.parts keys
  → stat from Pkg.Dist.Part.hash/size
  → read by HTTP GET of visible part paths
  → capabilities: list/read/stat/manifest true, watch/write false, freshness snapshot
```

This improves the design because it avoids inventing a second static-manifest grammar before we need one.
The existing `dist.json` can be the source of truth for static GET/pull Files views.

Boundaries:

- `dist.json` is a static capability projection, not live authority.
- Policy is export-time: only paths present in `hash.parts` are visible.
- Directory entries can be derived from part paths, but directory metadata is synthetic.
- MIME/content-type is not canonical in `dist.json`; infer only as convenience or add an explicit overlay
  later.
- `modified` is not per-file in `dist.json`; use build time only as snapshot metadata.
- Signed/trusted distribution can compose through `build.sign` and digest verification later.

Design effect:

```text
No change to the Cmd<T> grammar.
No transport-layer coupling.
Add an adjacent static adapter path that consumes canonical @sys dist metadata.
```

This should be treated as a STIER improvement: fewer custom schemas, more reuse of existing public-goods
infrastructure, and a cleaner path from `static public internet GET/pull` into the same Files client
surface.

## Data plane lens: structures vs content bodies

The command/control plane should carry information structures:

```text
capabilities
entries
manifests
content refs
hashes
sizes
media types
freshness
errors
```

Those structures are JSON-shaped and fit naturally through `Cmd<T>` over WebSocket or HTTP/JSON.

File bodies are a separate data plane:

```text
text/plain
text/markdown
application/json
application/yaml
application/octet-stream
video/*
image/*
```

The API should model bodies consistently, but the wire path may differ by transport/fidelity:

```text
ws
  Cmd<T> returns metadata/content-ref or small inline text
  large/binary bodies should use a follow-up content fetch/ref or later chunked stream

http/json:dynamic
  Cmd<T> request/response returns metadata/content-ref
  body bytes/text are fetched through normal HTTP GET when available

http/json:static
  dist.json/manifest returns path/hash/size refs
  body bytes/text are pure static GETs
```

Important distinction:

```text
http/json describes the command envelope, not every file body's media type.
```

A client facade can hide this behind a fetch-like content API:

```ts
type FilesContent = {
  readonly entry: Files.Entry;
  readonly mediaType?: t.StringMimeType;
  readonly size?: t.NumberBytes;
  readonly hash?: t.StringHash;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  bytes(): Promise<Uint8Array>;
  stream?(): ReadableStream<Uint8Array>;
};
```

The STIER rule: same conceptual API, not necessarily same wire encoding. Small text may be inline in a
`files:read` result; large text/binary/media should prefer content refs and standard fetch semantics.
This keeps WebSocket, dynamic HTTP, and static public GET/pull interoperable without forcing all bytes
through JSON.

## DMIND lens: UI binding without making UI the center

BMIND scan points from the relevant UI/state surfaces:

```text
code/sys.ui/ui-state/src/m.timecode/m.playback
  → pure playback state machine
  → PlaybackTimeline / beats / segments / virtualDuration
  → reducer inputs: playback:init/play/pause/seek and video/runner signals
  → reducer commands: deck load/play/pause/seek/swap
  → buildTimeline(experience) adapts a resolved timecode experience to UI-state

code/sys.ui/ui-react-components/src/ui/Media.Timecode.PlaybackDriver
  → runtime bridge between playback reducer commands and real video decks
  → Wire.Bundle = timeline spec + asset resolver
  → resolveBeatMedia is the boundary from authoring-time media refs to runtime hrefs

deploy/@tdb.edu.slug/src/ui/ui.TreeHost
  → structural tree layout host only
  → no domain semantics
  → Data adapters map slug trees to TreeHost view nodes

deploy/@tdb.edu.slug/src/ui/ui.Driver.TreeContent
  → selection-to-content bridge
  → composes selection + content controllers
  → loader is injected
  → current specs load file-content or playback-content from descriptor/static HTTP clients

deploy/@tdb.edu.slug/src/ui/ui.SlugSheet / ui.SlugSheetStack
  → sheet and stack render primitives
  → slots/main content, stack items, no file authority
```

The purpose-level mapping is strong, but only if the direction stays clean:

```text
Files.Cmd
  list/read/stat/manifest bounded files and content refs

Slug / Media domain layer
  parse authored YAML
  validate/derive slug trees, file-content docs, playback timelines, asset manifests

UI-state / UI components
  receive already-derived props/state
  render tree sheets/panels and drive playback
```

This means the future client binding can be simple:

```text
Files.Client-compatible facade
  → reads authored YAML or static manifest/content refs
  → optional slug/media projector derives JSON view models
  → TreeHost receives tree + selectedPath + slots
  → TreeContentDriver receives an injected loader
  → SlugSheetStack receives sheet items/slots
  → PlaybackDriver receives timeline bundle + resolveBeatMedia
```

The key IFF:

```text
IFF Files.Cmd passes file identity, content, capabilities, freshness, and content refs accurately,
THEN UI binding becomes prop wiring rather than transport plumbing.
```

With that in place, either path is valid:

```text
live/local authoring
  YAML over Files.Cmd
  client or local Cell parses/transpiles
  UI receives fresh props

server/Deno Deploy/WinterCG dynamic
  YAML or files backing read server-side
  server parses/transpiles/cache-projects
  UI receives JSON props over HTTP

static public internet
  prebuilt manifests/content refs
  UI pulls JSON/YAML/content by GET
  snapshot capabilities declare lower fidelity
```

The JSON props are not the authority. They are a view. The authored YAML and media refs can travel over
`Files.Cmd`, and the transpiler can sit client-side, server-side, or build-time without changing the UI
contract.

Non-goal: `@sys/server/files` must not import, know, or name `TreeHost`, `SlugSheet`, or
`PlaybackDriver`. Those components are excellent stress clients. They are not the substrate.

## Fidelity ladder

Same conceptual Files command/client surface. Different backing fidelity:

```text
ws
  live Cmd<T> service
  list/read/stat/watch
  fresh truth
  policy checked at request time

http/json:dynamic
  command-shaped request/response service
  list/read/stat
  live truth per request
  policy checked at request time
  watch only by polling or explicit event bridge

http/json:static
  manifest/content refs
  list/stat/read from snapshot
  policy checked at export time
  no live watch

pulled cache
  list/stat/read from materialized local view
  freshness depends on pull/update
  maybe local-only watch
```

This should be explicit and inspectable:

```ts
files.capabilities
// {
//   list: true,
//   stat: true,
//   read: true,
//   watch: false,
//   write: false,
//   freshness: 'snapshot',
// }
```

Clients should branch on capability, not on hidden transport assumptions.

The client should not ask, "am I on WebSocket?" as its first question. It should ask:

```text
can I list?
can I read?
can I watch?
how fresh is this view?
```

## Public namespaces

Canonical model export:

```ts
import { Files } from '@sys/model/files';
```

Possible `@sys/model/files` surface:

```ts
Files.Cmd          // primary grammar/types/helper surface
Files.Policy       // pure policy/matcher shapes for bounded file views
Files.Capability   // bounded authority shape
Files.Capabilities // capability/fidelity facts
Files.Entry        // canonical root-relative file/dir metadata
Files.ContentRef   // ref/hash/url/path descriptor for body retrieval
Files.Manifest     // portable fileset representation
Files.Client       // stable consumer facade types
```

Server/service export, naming not locked:

```ts
import { FilesServer } from '@sys/server/files';
```

Possible `@sys/server/files` surface:

```ts
FilesServer.create   // bind a model-owned backing to service lifecycle/status affordances
FilesServer.serve    // convenience wrapper over WebSocketServer.create(...)
```

Readonly filesystem-shaped backing belongs with the model, not the server:

```text
@sys/model/files/fs   → readonly backing adapter over a precise structural FS capability
@sys/fs               → concrete local FS primitives and optional bridge into @sys/model/files/fs
@sys/http/files       → dynamic HTTP/static GET adapter, if split out
@sys/server/files     → server/service composition only
```

`@sys/model/files/fs` must not depend on `@sys/fs` as its authority model. It defines the smallest
structural readonly capability needed by the Files backing. `@sys/fs` can satisfy or bridge into that
shape, but the model package owns the bounded Files semantics.

The important split:

```text
Files.Cmd          = the real domain contract, owned by @sys/model/files
Files.Client       = stable consumer facade shape over capability/fidelity differences
FilesFs.readonly   = binds model grammar to a bounded readonly filesystem-shaped capability
FilesServer.create = binds a model-owned backing to server lifecycle/service affordances
FilesServer.serve  = deployment convenience over WebSocketServer.create(...)
Static fromDist    = adapter over canonical dist.json, not a new domain grammar
```

`FilesServer.serve` must never be the conceptual center. It is a deployment convenience.

## Minimal usage sketch

Names are illustrative, not locked.

```ts
import { Files } from '@sys/model/files';
import { FilesFs } from '@sys/model/files/fs';
import { Fs } from '@sys/fs';
import { FilesServer } from '@sys/server/files';

const files = FilesFs.readonly({
  fs: Fs,
  root: './content',
  policy: Files.Policy.readonly(['**/*.md']),
});

const server = FilesServer.serve({
  files,
  path: '/files',
});
```

Under the hood:

```ts
FilesServer.serve(...)
  → WebSocketServer.create({
      cmd: {
        ns: Files.Cmd.ns,
        handlers: Files.Cmd.handlers(files),
      },
    })
```

Static projection, later:

```ts
const client = await FilesStatic.fromDist({
  origin: 'https://example.com/data/',
});
```

## First-class concepts

```text
Files.Cmd          // primary command grammar, model-owned
Files.Cursor       // versioned opaque cursor codec
Files.Capability   // bounded authority shape
Files.Capabilities // authority/fidelity facts
Files.Policy       // access model, default-deny
Files.Entry        // canonical root-relative file/dir metadata
Files.ContentRef   // body retrieval reference across transports
Files.Manifest     // portable fileset representation
Files.Client       // stable consumer facade shape
FilesFs            // model-owned readonly filesystem-shaped backing adapter
FilesServer        // server composition facade, not canonical model
FilesStatic        // static dist.json/GET adapter, not canonical model
```

Important rule:

```text
File paths are not authority.
The Files capability is authority.
A manifest is a portable view of that authority.
WebSocket and HTTP are access surfaces.
```

## Permission/access posture

Do not make first-land a full ACL system. Do design so ACL can fit later.

First land should be read-oriented. Write should arrive later as an explicit additive capability and
command grammar extension, not as pre-authorized latent surface area. Adding write later should mean
adding write policy/capability names and new command handlers, not re-architecting the client,
transport, or Files view model.

First-land should be capability-scoped:

```ts
const policy: Files.Policy.Shape = {
  list: ['**/*.md'],
  read: ['**/*.md'],
  watch: ['**/*.md'],
  deny: ['**/.env', '**/.git/**'],
};

const files = FilesFs.readonly({
  fs,
  root: './content',
  policy,
});
```

Rules:

- default deny
- no host absolute paths exposed to clients
- paths are canonical root-relative refs
- no traversal outside root
- no symlink escape
- denied entries do not appear in lists
- runtime policy applies to live service
- export-time policy applies to static snapshots

## Files listing

Listing is discovery, not raw `readdir`, and not content search.

Candidate command:

```text
files:list
```

Candidate entry shape:

```ts
type Entry = {
  readonly path: Files.StringPath;
  readonly kind: 'file' | 'dir';
  readonly size?: t.NumberBytes;
  readonly modified?: t.StringIsoDate;
  readonly hash?: t.StringHash;
};
```

Candidate payload shape:

```ts
type ListPayload = {
  /** Root-relative directory/scope. Defaults to root. */
  readonly path?: Files.StringPath;

  /** Path/name selection. Glob-like, not shell/rg syntax. */
  readonly match?: t.StringGlob | readonly t.StringGlob[];

  /** Omit paths. Applied after policy. */
  readonly exclude?: t.StringGlob | readonly t.StringGlob[];

  /** Bound traversal. */
  readonly depth?: Files.Depth;

  /** Page size/cursor. */
  readonly limit?: Files.Limit;
  readonly cursor?: Files.Cursor.List;
};
```

TMIND notes:

- `path` scopes the listing to a root-relative directory or logical subtree.
- `match` selects by path/name shape only; it is not content search.
- `exclude` removes path/name matches after policy has already applied.
- `depth` makes traversal bounded and deterministic.
- `limit` and `cursor` make large views page-safe.
- `grep`, `rg`, and `query` are intentionally not used for list.
- Content search, if needed, should become a later `files:search` grammar.

Type note:

```ts
export type StringGlob = string;
```

`t.StringGlob` has landed in `@sys/types` as a descriptive alias. It is still a string at runtime, but
the type name calls out the semantic contract: glob-like path selection, not shell syntax and not
content grep.

Commit message:

```text
feat(types): add StringGlob alias
```

Bounds to design:

- glob semantics and matching helper
- depth
- limit/cursor
- file/dir inclusion
- deterministic sort
- denied entries omitted

## File content

Candidate command:

```text
files:read
```

First land should likely be text-first, with `maxReadBytes`.

Candidate result shape:

```ts
type ReadResult = {
  readonly file: Entry;
  readonly encoding: 'utf8';
  readonly content: string;
};
```

Binary can come later through content refs/fetch semantics first, and only then through base64 or
byte-streaming if the need becomes concrete. Do not force large binary/media through JSON command
results.

## File changes

Change events are hints. `list`, `stat`, and `read` are truth.

Candidate event shape:

```ts
type Changed = {
  readonly kind: 'created' | 'modified' | 'deleted';
  readonly path: string;
  readonly seq?: number;
};
```

Transport fidelity matters:

- live WebSocket may support watch/change events
- static snapshot cannot support live watch
- pulled cache may support local watch or refresh only

## Implementation sequence

First implementation should start in `@sys/model/files` with types and grammar, not transport mechanics.

1. Stub the domain/types namespace in `@sys/model/files`:

   ```text
   Files.Cmd
   Files.Policy
   Files.Capability
   Files.Entry
   Files.ContentRef
   Files.Manifest
   Files.Client
   ```

2. Lock the canonical `Cmd<T>` grammar:

   ```text
   files:capabilities
   files:list
   files:stat
   files:read
   files:watch? / files:changes?
   files:manifest?
   ```

3. Define abstract backing/projection modes as adapters to the same grammar:

   ```text
   ws
     live Cmd transport

   http/json:dynamic
     request/response command-shaped HTTP endpoint
     Deno Deploy compatible

   http/json:static
     manifest/content refs
     S3/IPFS/static bucket compatible
   ```

4. Implement minimal adapters in this order:

   ```text
   readonly @sys/model/files/fs backing over a precise structural FS capability
   in-memory fixture backing for grammar/backing tests
   optional @sys/fs bridge into the readonly files/fs capability
   WebSocket serve proof via @sys/server/files
   static dist.json reader via @sys/std/pkg
   dynamic HTTP later
   ```

The design must make clear that these are not three APIs. They are fidelity implementations of one
Files command/client surface.

## Essence examples

Before heavy implementation, create tiny realistic examples that make the `Cmd<T>` shape obvious.
These should be small enough to read in one screen but realistic enough to test the design language.

### Hello World fileset

```text
/
└─ hello.txt
```

Possible command result examples:

```ts
await client.send('files:list', { path: '/' });
// → { entries: [{ path: 'hello.txt', kind: 'file', size: 13 }] }

await client.send('files:read', { path: 'hello.txt', encoding: 'utf8' });
// → { file: { path: 'hello.txt', kind: 'file' }, encoding: 'utf8', content: 'Hello, world.' }
```

### Foobar fileset

```text
/
├─ foo.json
├─ bar.yaml
└─ notes/
   └─ baz.md
```

This should exercise directories, multiple text formats, stable ordering, stat/read, and policy denial.

Possible object sketch:

```ts
const foobar = Files.Memory.create({
  files: {
    'foo.json': '{ "foo": true }\n',
    'bar.yaml': 'bar: true\n',
    'notes/baz.md': '# Baz\n',
  },
  policy: Files.Policy.readonly(['*.json', '*.yaml', 'notes/*.md']),
});
```

These examples should become fixtures or docs once the concrete API names settle.

## Required design work

Before implementation, lock these:

1. Bounded file scope
   - root directory semantics
   - path normalization
   - symlink policy
   - hidden-file policy
   - traversal rejection
   - allow/deny matching

2. Command grammar
   - command names
   - payload maps
   - result maps
   - event maps
   - error shapes
   - version/namespace posture

3. Permissions
   - read/list/write/delete/watch/index as separate capabilities
   - default-deny posture
   - whether writes are in first land
   - whether watch/index are in first land

4. Representation
   - `Files.Entry`
   - `Files.Manifest`
   - `Files.ContentRef`
   - hash strategy
   - static `dist.json` alignment
   - relationship to existing dist/pull conventions

5. Observability
   - status/details for the files capability
   - events for file changes if supported
   - audit-friendly error messages

6. Transport/fidelity posture
   - `Files.Cmd` is the primary IO grammar and belongs in `@sys/model/files`
   - `Files.Client` shape hides transport where fidelity allows
   - `ws` is live, bidirectional, and highest fidelity
   - `http/json:dynamic` is live request/response
   - `http/json:static` is snapshot manifest/content refs
   - `FilesServer.serve` composes with `WebSocketServer`
   - no `websocket/files` export

7. Tests
   - model grammar/type tests first
   - port-level grammar/handler tests next
   - filesystem safety tests with fixtures
   - one WebSocket integration proof only
   - static `dist.json` adapter tests if/when static lands

## Candidate first-land command grammar

Keep first land narrow. Candidate read-oriented observable grammar:

```text
files:capabilities
files:list
files:stat
files:read
files:watch
```

Possible later grammar:

```text
files:write
files:delete
files:mkdir
files:move
files:index
files:search
files:snapshot
```

Do not include write/delete/index/search in first land unless the safety model is fully locked.

The first implementation should prove the `Cmd<T>` grammar over transports cleanly: WebSocket first,
then HTTP/static projection as a design target. It should not labor full write semantics early.

## Candidate first-land speech acts

```text
create a bounded files capability for <root>
list files under <path>
read a file under <path>
stat a file under <path>
observe changes under <path>
return capability facts for a files view
return a manifest for a bounded files set
reject path traversal outside <root>
reject paths not allowed by policy
serve the files command surface over WebSocket
prove the files command grammar through a Cmd port
prove one WebSocket roundtrip for the files command surface
```

## Testing principle

Most correctness belongs to the files `Cmd<T>` design and handler safety model, not WebSocket server
plumbing.

Test mainly at the Cmd/port/handler level:

```text
Files.Cmd grammar
+ Files handlers
+ filesystem fixture
+ Cmd port tests
```

Then add one thin integration proof:

```text
Files.Cmd + WebSocketServer transport = works
```

Do not repeatedly retest the generic WebSocket server lifecycle in files tests.

## Non-goals

- No generic filesystem API.
- No unbounded host filesystem access.
- No implicit write/delete permissions.
- No app-server/router/session layer.
- No file grammar under `@sys/server/websocket/*`.
- No canonical Files model under `@sys/server`; server is a facade only.
- No UI/file browser.
- No indexing/search unless explicitly included in a later scoped plan.
- No replacement of `@tdb.data` in this plan.

## Resolved design questions

- First-land backings are readonly. `watch` is part of the Cmd grammar and capability map, but readonly `files/fs`, memory, and static backings reject it unless a future live fidelity adapter explicitly implements it.
- Glob/match primitive truth lives in `@sys/std/glob`; Files keeps model-domain policy/list semantics over that primitive.
- Error algebra is shared by suffix under `Files.Error.KindSuffix`, with backing-scoped concrete names such as `FilesFsError.*`, `FilesMemoryError.*`, and `FilesStaticError.*`.
- `Files.Manifest` is the neutral portable Files view. Static `dist.json` is adapted into it; `t.DistPkg` remains canonical distribution metadata, not the Files manifest schema.
- Static `dist.json` support landed as `FilesStatic.fromDist({ dist, baseUrl?, policy?, defaultLimit? })`. The model adapter consumes an already-provided `t.DistPkg`; it does not fetch, start servers, or perform host IO.
- The common client facade is the stable `Files.Cmd` grammar. WebSocket, HTTP JSON, and static refs are fidelity/data-plane choices under the same Files conversation.

## Phase delivery ledger

Plan file: `/Users/phil/code/org.sys/sys/-agent/server-files.plan.md`

This ledger is the durable post-implementation state. It records the actual commit messages and hashes,
not only the initial intent.

Phase 1 — WebSocket Cmd transport substrate
  [x] `1b861c1a5` feat(server): add websocket command server type surface
  [x] `277523e69` feat(server): add websocket command server primitive
  [x] `33633db69` test(server): prove websocket Cmd transport contracts
  [x] `f27d6ea03` docs(server): document websocket Cmd transport usage

  Final state:
  - `@sys/server/websocket` owns the generic WebSocket command/service substrate.
  - The primitive is not Files-specific; it binds typed `Cmd<T>` handlers over WebSocket lifecycle/status.

Phase 2 — HTTP Cmd transport substrate
  [x] `2078f26fd` feat(http): add Cmd HTTP JSON transport
  [x] `ce6fe5293` test(http): prove Cmd HTTP JSON transport contracts

  Final state:
  - `@sys/http` owns command-shaped HTTP JSON request/response transport.
  - HTTP remains transport fidelity; it does not own Files grammar or backing authority.

Phase 3 — Files model grammar
  [x] `2bf4cdacb` feat(model): add files command grammar

  Final state:
  - `@sys/model/files` owns the stable Files language: `Files.StringPath`, entries, content refs,
    capabilities, policy, manifest, cursor, command names, payloads, results, events, and client types.
  - The command type-surface proof landed with the grammar implementation rather than as a separate commit.

Phase 4 — Files model backings (readonly-first)
  [x] `b1401a446` feat(model): add readonly files/fs backing adapter
  [x] `7ebdea61f` test(model): prove readonly files/fs backing safety contracts
  [x] `9db145405` fix(model): throw native files/fs errors
  [x] `8c499aad0` fix(model): harden readonly files authority contracts
  [x] `e29b0b99d` feat(model): add in-memory files backing
  [x] `ccddac1ac` test(model): prove files/fs symlink containment policy
  [x] `e53a724d8` test(add): symlinks

  Final state:
  - `@sys/model/files/fs` is a readonly filesystem-shaped backing over a structural capability.
  - `@sys/model/files/memory` is a readonly snapshot backing for deterministic tests and lightweight use.
  - Host paths stay hidden; client-visible paths are canonical `Files.StringPath` values.
  - Symlink escape behavior is proven at the model boundary and was later reinforced by real-FS bridge tests.

Phase 5 — Optional `@sys/fs` bridge
  [x] `55124fd4a` fix(model): resolve files/fs listings against canonical root
  [x] `d04b6b268` feat(fs): expose files/fs readonly capability bridge
  [x] `23ad9c4df` test(fs): prove files/fs bridge does not widen Files authority
  [x] `65f044bd3` test(fs): reject directory symlink escapes in files bridge

  Final state:
  - `@sys/fs` adapts local filesystem authority into `@sys/model/files/fs`; the model does not import `@sys/fs`.
  - Listings resolve against canonical real root authority.
  - Real file and directory symlink escapes are rejected without leaking host paths.

Phase 6 — Server facade
  [x] `eb9ef58b9` feat(server): add files websocket service facade
  [x] `2535eabea` test(server): prove files service over websocket

  Final state:
  - `@sys/server/files` is a thin facade over `Files.Cmd.ns`, structural Files backing handlers, and
    `WebSocketServer.create(...)`.
  - It imports no concrete Files backings and no local filesystem bridge.
  - Service status exposes renderer-neutral metadata: Files kind, fidelity, and active capabilities.
  - WebSocket tests prove remote capabilities/list/read match direct backing behavior and denied reads cross as
    safe `CmdError.Remote` failures.

  Validation:
  - `deno fmt --check deno.json src/files src/common/t.ts src/types.ts`
  - `deno task check`
  - `deno task test --trace-leaks ./src/files/-test`
  - `deno task test`
  - `deno task dry`

Phase 7 — Static adapter
  [x] `158156048` refactor(model): share files backing helpers
  [x] `3c1c6ff77` feat(model): add static dist files adapter
  [x] `df7b6f01a` test(model): prove dist files static capability

  Final state:
  - Shared Files backing helpers live under `m.files`: page/cursor, match, policy, and list scope/depth semantics.
  - `@sys/model/files/static` exposes `FilesStatic.fromDist({ dist, baseUrl?, policy?, defaultLimit? })`.
  - The static adapter consumes canonical `t.DistPkg` metadata and produces snapshot Files Cmd handlers.
  - The static adapter does not fetch, start servers, perform host IO, or import `@sys/fs`, `@sys/http`, or
    `@sys/server`.
  - `files:read` returns URL or hash `ContentRef` results; bodies remain a separate data plane.
  - Manifest content refs are emitted only for read-authorized files.
  - Policy is default-deny and snapshotted; caller mutation cannot widen authority.
  - Static command edge coverage proves precise error classification, match/exclude/depth behavior, invalid dist
    parts, file/dir conflicts, URL formation/encoding, and no-size part handling.

  Validation:
  - `deno fmt --check deno.json src/m.files src/m.files.fs src/m.files.memory src/m.files.static src/types.ts`
  - `deno task check`
  - `deno task test --trace-leaks ./src/m.files.static/-test`
  - `deno task test`
  - `deno task dry`

## Final STIER note

The win is that `@sys/server/websocket` turns one transport into a solved substrate while
`@sys/model/files` keeps the domain model server-neutral. Files can now be designed as a clean `Cmd<T>`
domain: permissioned, testable, observable, portable across network surfaces, and honest about fidelity.

This is not just another FS-shaped API. It is a portable, capability-aware Files view for browsers,
agents, live Cells, static endpoints, and pulled caches.
