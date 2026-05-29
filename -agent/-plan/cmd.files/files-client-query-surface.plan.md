# Files client query surface plan

- [x] refactor(model): rename manifest content refs
- [x] fix(event): dispose stream event subscriptions on terminal
- [x] feat(model): add Files client query surface
- [x] refactor(draft-shell): consume Files client query surface

## Purpose

Land the next Files client API step as a small, truthful query surface over the existing typed Files Cmd grammar.

The design target is a humane client that makes normal read/query/watch use obvious without hiding the raw command escape hatch:

```ts
await client.capabilities();
await client.list(input);
const entry = await client.stat(path);
const manifest = await client.manifest({ contentRefs: true });
await client.readText(path, options);
const watch = client.watch(input);
client.cmd.send(...); // raw escape hatch remains explicit.
```

## Review posture

BMIND reset: do not let the AppShell sample, the existing raw Cmd names, or earlier `content: true` habit define the API. Start from the primitive boundary.

Hard STIER lens:

- A user must not wonder whether `manifest({ content: true })` returns inline bytes/text.
- The public manifest contract should say `contentRefs`, never `content`, wherever refs are meant.
- Asking for refs should make the result shape predictable: a `contentRefs` array is present, even when empty.
- The client must expose nouns that match the data actually returned.
- Thin wrappers are acceptable; clever lifecycle managers, pagination helpers, and policy decisions are not.
- Stream event subscriptions must be lifecycle-contained: disposing the stream must dispose `onEvent(...)` lifecycles.
- `list` and `manifest` may overlap in entries, but they must not collapse into one vague primitive.
- Raw Cmd remains available, so the humane surface can stay tight.

DMIND note: no separate DMIND canon posture was found; treat this plan as the design-review cycle layered on BMIND/STIER.

## Final reality

Implementation facts landed and to preserve:

- `Files.Client.Handle` exposes the raw `cmd` escape hatch plus the humane query/read/watch surface:
  - `capabilities()`
  - `list(input?)`
  - `stat(path)` returning `Entry` directly
  - `manifest(input?)`
  - `manifest({ contentRefs: true })` with a present `contentRefs` array in the result type
  - `readText(path, options?)`
  - `watch(input?)` returning the typed Cmd stream handle
- `Files.Cmd.List.Payload` supports query richness:
  - `path`
  - `match`
  - `exclude`
  - `depth`
  - `limit`
  - `cursor`
- `Files.Cmd.Manifest.Payload` mirrors list paging/filter scope and adds `contentRefs?: boolean`.
- `Files.Manifest` exposes `contentRefs?: readonly ContentRef[]`; no public manifest `content` alias remains.
- Static manifests may return read-authorized refs under `contentRefs`; fs/memory manifests return
  `contentRefs: []` when refs are requested but unavailable.
- AppShell's sample client bucket now calls `client.capabilities()`, `client.list()`,
  `client.manifest({ contentRefs: true })`, `client.readText(path)`, and `client.watch()`.

## Top-level decision

`manifest` is a metadata/snapshot primitive. It must never inline file content.

Target vocabulary:

```ts
client.manifest();
client.manifest({ contentRefs: true });
```

Meaning:

- default: manifest meta + entries;
- opt-in: manifest meta + entries + `contentRefs` array;
- if no refs are available, the opt-in result carries `contentRefs: []` rather than a missing maybe-field;
- never: inline file bytes/text.

Content materialization remains a separate operation:

```ts
const manifest = await client.manifest({ contentRefs: true });
const text = await client.readText(path);
// Existing lower-level materialization remains explicit:
// await Files.ContentRef.text(ref);
```

## Contract target

Prefer the clean public contract over a long-lived compatibility shim:

- Rename manifest request intent from `content` to `contentRefs`.
- Rename manifest result field from `content` to `contentRefs`.
- Do not expose both names on the humane client surface.
- Prefer no public compatibility alias; if release compatibility requires one, stop and make that explicit.
- Do not add an `include` bag; it invites vague growth.
- Do not auto-fetch content from refs inside `manifest`.

If a temporary translation seam is required during implementation, isolate it behind the client or command handler and keep it private. The STIER target is no public `content` manifest option or result field that can be mistaken for bytes/text.

Sketch:

```ts
type FilesScopeQuery = {
  path?: t.Files.String.Path;
  match?: t.Files.Match;
  exclude?: t.Files.Match;
};

type FilesTreeQuery = FilesScopeQuery & {
  depth?: t.Files.Depth;
};

type FilesPageInput<K extends t.Files.Cursor.Kind> = {
  limit?: t.Files.Limit;
  cursor?: t.Files.String.Cursor<K>;
};

type ListOptions = FilesTreeQuery & FilesPageInput<'list'>;

type ManifestOptions = FilesTreeQuery &
  FilesPageInput<'manifest'> & {
    /** Include portable content references when available; never inline content. */
    contentRefs?: boolean;
  };

type WatchOptions = FilesScopeQuery & {
  since?: t.Files.Seq;
};

type Manifest = {
  readonly '.meta': t.Files.ManifestMeta;
  readonly entries: readonly t.Files.Entry[];
};

type ManifestWithContentRefs = Manifest & {
  readonly contentRefs: readonly t.Files.ContentRef[];
};
```

Implementation may factor these names differently to fit the existing monolithic Files type spine, but the public semantics should remain this small.

## Stream lifecycle semantics

`client.watch(input?)` returns the existing typed Cmd stream handle. The stream owns its event subscriptions.

Canonical watch cleanup:

```ts
const watch = client.watch({ match: '**/*.yaml' });
watch.onEvent((event) => console.info('changed', event.path, event.kind));

// Later: one call is enough.
watch.dispose();
```

Manual disposal of the `onEvent(...)` lifecycle is still allowed for early unsubscription, but it should not be required to prevent leaks. Disposing the stream, terminal stream completion, stream cancellation, and parent client disposal should dispose any active event-subscription lifecycles returned by `onEvent(...)`.

This is a Cmd stream substrate invariant, not a Files-specific wrapper trick. It is proven at
`@sys/event/cmd`; Files call-sites rely on `client.watch(...).dispose()` / stream terminal cleanup
rather than manually disposing every event subscription.

## Path semantics

Files client paths are root-relative.

Canonical root behavior:

```ts
await client.list();
await client.list({ path: '' });
await client.manifest();
await client.manifest({ path: '' });
```

These are equivalent. Samples should usually omit `path` when querying root.

`path: '.'` may be accepted as a filesystem-familiar input alias only if it normalizes to the canonical root path `''`. Public outputs should remain canonical root-relative paths and should not emit `'.'`.

Use `path` only when scoping below root:

```ts
await client.list({ path: 'docs', depth: 1 });
await client.stat('shell.yaml');
await client.readText('docs/readme.md');
```

Client overloads may earn their place for manifest because they remove result maybe-creep:

```ts
manifest(): Promise<t.Files.Manifest>;
manifest(options: t.Files.Client.ManifestOptions & { contentRefs: true }): Promise<t.Files.ManifestWithContentRefs>;
manifest(options?: t.Files.Client.ManifestOptions): Promise<t.Files.Manifest>;
```

## `list` vs `manifest`

They overlap in entry shape by design; they differ by job.

`list(input?)` is a lightweight catalog query:

- browse a path;
- page through entries;
- power tree/nav/autocomplete/pickers;
- return only `{ entries, cursor?, truncated? }`.

`manifest(input?)` is a durable snapshot document:

- preserve model version and capabilities;
- optionally carry static/dist provenance;
- optionally carry portable content refs;
- support export, sync, indexing, and handoff flows.

Rule of thumb:

```text
list     = query result
manifest = snapshot document
```

Do not add manifest meta to `list`. Do not turn `manifest` into content transport.

## Implementation sequence

Completed:

1. Normalized manifest vocabulary.
   - Renamed public manifest payload/result contracts from `content` to `contentRefs`.
   - Updated static/fs/memory handlers and tests mechanically.
   - Ensured `contentRefs: true` yields a present array, empty when no refs are available.
   - Left no public `content` manifest alias.
2. Locked Cmd stream subscription disposal at the substrate.
   - Added/proved event subscription cleanup for terminal result, stream disposal, and client disposal
     in `@sys/event/cmd`.
   - Files tests only prove `client.watch(input?)` delegates to and returns the typed stream handle.
3. Added model client types.
   - Added client option/result aliases where they clarify the handle surface.
   - Kept the monolithic `Files` type spine intact.
4. Added thin `Files.Client.Handle` methods.
   - `capabilities()` sends `files:capabilities` and returns `Capabilities`.
   - `list(input?)` sends `files:list` and returns the list result.
   - `stat(path)` sends `files:stat` and returns the `Entry` directly, not `{ entry }`.
   - `manifest(input?)` sends `files:manifest` with the `contentRefs` vocabulary.
   - `watch(input?)` streams `files:watch` and returns the existing typed stream handle; caller owns `dispose()`.
   - Kept `cmd` unchanged as the raw escape hatch.
5. Added focused model tests.
   - Client wrappers send/stream the expected commands.
   - `manifest()` defaults to no refs.
   - `manifest({ contentRefs: true })` returns a `contentRefs` array.
   - No test implies inline content is returned by manifest.
6. Updated the AppShell sample bucket.
   - Replaced raw capability/list/manifest/watch calls in `-u.Files.client` with the earned client surface.
   - Kept it sample/spec-only; no product lifecycle manager or generic filesystem abstraction.

## Acceptance checks

Completed checks:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.model/model && deno task test --trace-leaks ./src/m.files ./src/m.files.static ./src/m.files.memory ./src/m.files.fs
cd /Users/phil/code/org.sys/sys/code/sys.model/model && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/http && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/server && deno task check
cd /Users/phil/code/org.sys/sys/deploy/@draft.shell && deno task check
```

Targeted HTTP/server/static sample checks also passed during the manifest vocabulary rename.

## Non-goals

- No write/remove convenience methods in this pass.
- No auto-pagination helpers.
- No content prefetching.
- No `Files.Client` lifecycle manager beyond existing handle disposal.
- No AppShell product logic.
- No transport-fidelity redesign; binary JSON and watch resume remain in `transport-fidelity-hardening.plan.md`.

## Landed commits

- `65f6658ad` — `refactor(model): rename manifest content refs`
- `382d585bd` — `fix(event): dispose Cmd stream event subscriptions`
- `7d792fdd9` — `feat(model): add Files client query surface`
- `cf86f5ce4` — `refactor(draft-shell): consume Files client query surface`

## Closed implementation revs

- Re-checked `manifest.content` and `{ content: true }` call-sites; only intentional negative type
  proof remains where applicable.
- Removed the public `content` manifest spelling instead of carrying a compatibility alias.
- Manifest overloads stayed narrow and earned their place by exposing the present `contentRefs` array
  when callers request refs.
