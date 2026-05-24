# Files ContentRef resolution plan

Thread title: `/files-content-ref-resolution`

Status: **landed**.

Landed commit:

```text
8bebdf7b95aa3e23770cd8335e0ec3798c900f02 — feat(model): add Files ContentRef resolvers
```

Short hash:

```text
8bebdf7b9
```

## Final reality

The static Files sample revealed a real Files-domain concept, but the right name was not
`Files.Fetch.*`.

Final public surface:

```ts
Files.ContentRef.bytes(ref, options?)
Files.ContentRef.text(ref, options?)
```

The runtime root now includes:

```text
Files.Authority
Files.Cmd
Files.Client
Files.ContentRef
Files.Cursor
Files.Policy
```

This is acceptable because `ContentRef` was already a first-class Files type concept. The commit did
not add a generic fetch surface; it gave the existing Files content-reference concept resolver
behavior.

## Core thesis preserved

```text
Files.Client     = Cmd/handle binding and command ergonomics.
Files.ContentRef = Files-domain content-reference resolution.
```

The command path remains:

```text
Files.Client.local/websocket/transport
→ files.cmd.send(Files.Cmd.Name.read, { path })
→ Files.Cmd.Read.Result
```

The content path begins only when a read result returns a ref:

```text
Files.ContentRef
→ bytes/text
```

Canonical usage:

```ts
const read = await files.cmd.send(Files.Cmd.Name.read, { path });
if (read.kind !== 'ref') throw new Error('Expected a content ref.');

const text = await Files.ContentRef.text(read.contentRef);
```

This preserves the important truth that static Files read returns a content ref, while making the
second step humane.

## Landed implementation

### Runtime/API

- [x] Added runtime `Files.ContentRef` to `@sys/model/files`.
- [x] Added `ContentRef.Lib` to the monolithic `m.files/t.ts` public contract.
- [x] Added `Files.ContentRef.bytes(ref, options?)` returning `Uint8Array`.
- [x] Added `Files.ContentRef.text(ref, options?)` returning UTF-8 text.
- [x] Kept `Files.Client.readText(...)` unchanged and inline-only.
- [x] Kept public input Files-domain only: `Files.ContentRef`, not arbitrary URLs or `Request`s.

### Implementation structure

Landed under:

```text
code/sys.model/model/src/m.files/m.ContentRef/
```

Files:

```text
common.ts
m.bytes.ts
m.text.ts
mod.ts
u.error.ts
u.fetch.ts
u.verify.ts
-test/-m.ContentRef.test.ts
```

Shape:

```text
mod.ts      = small public surface composition
m.bytes.ts  = bytes resolver
m.text.ts   = text resolver
u.fetch.ts  = fetch/cancellation mechanics
u.verify.ts = size/hash verification
u.error.ts  = Files-domain errors
```

### Resolution behavior

- [x] URL refs resolve now.
- [x] Hash refs reject with explicit Files-domain unsupported-ref errors.
- [x] Opaque refs reject with explicit Files-domain unsupported-ref errors.
- [x] `fetch` can be injected for tests/non-global runtimes.
- [x] Global Web Fetch is used when available and no fetch is injected.
- [x] HTTP non-2xx responses become Files-domain errors.
- [x] Fetch failures become Files-domain errors.
- [x] Underlying content URL is not leaked in pinned Files-domain error messages.

### Integrity and cancellation

- [x] Verifies `ContentRef.size` by default when present.
- [x] Verifies `ContentRef.hash` by default when present.
- [x] Supports `sha256` and `sha1` via `@sys/crypto/hash`.
- [x] Supports explicit `verify: false`.
- [x] Supports partial verification switches: `{ size?: boolean; hash?: boolean }`.
- [x] Supports `signal?: AbortSignal`.
- [x] Supports `until?: t.UntilInput` via `@sys/std/dispose`.

### Errors

Landed Files-domain error kinds:

```text
FilesContentRefError.Unsupported
FilesContentRefError.FetchUnavailable
FilesContentRefError.FetchFailed
FilesContentRefError.HttpFailure
FilesContentRefError.SizeMismatch
FilesContentRefError.HashMismatch
FilesContentRefError.HashUnsupported
FilesContentRefError.UnsupportedEncoding
FilesContentRefError.DecodeFailed
```

## Sample migration

The static server sample now keeps both truths visible:

```ts
const read = await files.cmd.send(Files.Cmd.Name.read, { path });
if (read.kind !== 'ref') throw new Error('Expected a content ref.');

const text = await Files.ContentRef.text(read.contentRef);
```

The sample still teaches that static Files read returns a URL content ref. It now follows that ref
through the Files-domain resolver rather than ad-hoc HTTP fetch.

Touched sample files:

```text
code/sys/server/-sample/files.static/-.test.ts
code/sys/server/-sample/files.static/docs/README.md
```

## Tests and proofs at landing

Final proof before commit:

```text
@sys/model:  deno task check ✅
@sys/model:  deno task test ✅ — 42 passed / 209 steps
@sys/server: deno task check ✅
@sys/server: deno task test --trace-leaks ./-sample/files.static/-.test.ts ✅
```

Focused ContentRef proof:

```text
deno task test --trace-leaks ./src/m.files/m.ContentRef/-test/-m.ContentRef.test.ts ✅
```

Behavior covered:

- public API identity/surface,
- URL refs resolving to bytes and text through injected fetch,
- unsupported refs rejected before fetch,
- non-OK HTTP responses mapped to Files-domain errors,
- size/hash verification by default,
- explicit verification disable.

Type-contract proof:

```text
code/sys.model/model/src/m.files/-test/-t.test.ts
```

It proves the public contract boundaries without runtime museum assertions:

- consumers stay on the single `Files` namespace,
- content refs are Files-domain values, not host paths or generic fetch inputs,
- cursor brands stay scoped at command boundaries,
- read result variants stay mutually exclusive by `kind`,
- backing error names use canonical Files suffixes,
- handler maps bind to the Files Cmd event grammar.

## Non-goals preserved

- [x] Did not add `Files.Fetch.*`.
- [x] Did not add `Files.Client.Ref.*`.
- [x] Did not change `Files.Client.readText(...)` in this pass.
- [x] Did not make static Files read return inline text.
- [x] Did not introduce HTTP Cmd transport behavior.
- [x] Did not accept arbitrary URL strings or `Request` objects.
- [x] Did not solve caching policy.
- [x] Did not support opaque `ref` or hash-addressed refs until their authority/store semantics are
      known.

## Follow-on note: client symmetry

A later, separate feature may add explicit optional client composition, for example:

```ts
Files.Client.local(backing, { contentRef: Files.ContentRef });
Files.Client.transport(endpoint, { contentRef: Files.ContentRef });
```

If added, `readText` could resolve refs only when a resolver is explicitly configured. That work is
intentionally not part of this commit. The landed boundary is clean:

```text
Files read → inline content OR content ref
Files.ContentRef → content ref materialization
```
