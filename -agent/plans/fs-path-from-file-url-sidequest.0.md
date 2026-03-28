# Side Task Context: `Fs.Path` File URL → Path Primitive

## Why this came up
During the media-seq parity harness work in:

- `/Users/phil/code/org.sys/sys/deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/-test.comparator/u.fixture.ts`

we reached for:

- `Fs.Path.from(import.meta.url)`

because converting `import.meta.url` into a filesystem path is a real recurring need.

That method does **not** exist on the current `Fs.Path` surface (at least on the exported API used in this module), so a local conversion was used instead.

## b-mind assessment (locked)
- Reaching for `Fs.Path.from(...)` was conceptually reasonable.
- It was not grounded in the actual current API.
- The need is real, but the primitive should be named truthfully and placed at the right layer.

## Candidate API (preferred)
If added later, prefer an explicit file-URL primitive:

- `Fs.Path.fromFileUrl(url: string | URL): string`

Avoid a vague generic name like:

- `Fs.Path.fromUrl(...)`

unless it truly supports non-file URLs (which is likely not desirable for `Fs.Path`).

## Why this naming matters
- `import.meta.url` is a **file URL**, not a generic filesystem path.
- The conversion is a URL-semantics operation and should say so explicitly.
- Truthful naming prevents accidental misuse and API ambiguity.

## Scope (for later thread)
- Inspect `@sys/fs` and related std/path surfaces for an existing canonical helper.
- If absent, assess whether this belongs in:
  - `@sys/fs` `Fs.Path`
  - or a different canonical URL/path conversion surface
- Add only if the need is recurring enough (not just one local test harness).

## Non-goal
- Do not derail current media-seq parity/integration work.
- This is a side-task context note only.
