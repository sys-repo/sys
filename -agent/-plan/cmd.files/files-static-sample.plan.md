# Files static sample plan

Thread title: `/files-static-sample`

## BMIND review

This is the highest-value next sample because it proves the opposite end of the Files lifecycle from
`files.websocket`.

The current sample proves the live authoring/dev-server path:

```text
host filesystem
→ bounded Files/fs live backing
→ Files WebSocket server
→ Files client
```

The missing sample should prove the published/static runtime path:

```text
dist.json + static assets
→ plain static HTTP server
→ client fetches dist.json
→ FilesStatic.fromDist(..., baseUrl)
→ Files client over static backing
→ manifest/list/stat/read-ref
→ content refs fetch plain HTTP assets
```

This is not another WebSocket sample. Static-dist-over-WebSocket would mostly repeat the existing
transport proof with a different backing and would not teach the important production story. The
important story is: once a bundle is generated, a client can reconstruct a bounded Files view from
`dist.json`, and content is fetched as normal static HTTP assets through URL content refs.

## Ownership decision

The implementation should use the `@sys/http` static server, not `@sys/server` WebSocket hosting.

Preferred sample location:

```text
code/sys/http/-sample/files.static/
```

Reasoning:

- `@sys/server/-sample/files.websocket` owns the live Files-over-WebSocket service story.
- `@sys/http/server/static` owns plain static HTTP serving.
- `FilesStatic.fromDist(...)` lives in `@sys/model/files/static` and can run client-side after
  fetching `dist.json`.
- A server-package sample that imports `@sys/http` just to host static assets would blur package
  ownership.

This plan lives under `-agent/-plan/cmd.files` because it closes the Files arc, not because the
runtime sample must live in `@sys/server`.

## Task naming

If implemented in `code/sys/http/deno.json`, prefer explicit names:

```json
{
  "tasks": {
    "sample:files": "deno task sample:files:static",
    "sample:files:static": "deno run -P=sample-files-static ./-sample/files.static/-start.ts"
  }
}
```

Use `static`, not `dist`, because the public Files concept is a static Files backing. `dist.json` is
the input artifact.

Do not overload `sample:files:http` yet. HTTP Cmd transport has open fidelity work around byte JSON
encoding, watch semantics, and structured remote errors. A later HTTP Cmd sample should wait for that
transport-fidelity arc.

## Sample shape

Suggested files:

```text
code/sys/http/-sample/files.static/
  -start.ts
  common.ts
  t.ts
  dist/
    dist.json
    hello.txt
    hello.json
    docs/README.md
  docs/README.md
  -test/-.test.ts
```

`dist/` should be a tiny checked-in static bundle. It does not need a generated build pipeline for
this first sample; the important contract is the shape of `dist.json` plus the static assets it
indexes. Keep hashes/sizes deterministic and small.

## Runtime flow

The sample should start a plain static HTTP server:

```ts
const server = await HttpStatic.start({
  dir: './-sample/files.static/dist',
  port,
  name: '@sys/http:sample:files:static',
  info: { dist: '/dist.json' },
  lifecycle: 'process', // if supported by the current HTTP static start surface
  keyboard: true,
});

await server.finished;
```

If `HttpStatic.start(...)` does not expose exactly the same lifecycle controls as WebSocket startup,
follow the existing HTTP static server owner surface rather than inventing sample-local lifecycle
plumbing.

The behavior test should exercise the client-side static Files reconstruction:

```ts
const origin = `http://127.0.0.1:${port}` as t.StringUrl;
const fetched = await Pkg.Dist.fetch({ origin });
if (!fetched.dist) throw new Error('Expected dist.json.');

const backing = FilesStatic.fromDist({
  dist: fetched.dist,
  baseUrl: origin,
  policy: Files.Policy.readonly('**'),
});
const files = Files.Client.local(backing);

try {
  const manifest = await files.cmd.send(Files.Cmd.Name.manifest, { content: true });
  const read = await files.cmd.send(Files.Cmd.Name.read, { path: 'docs/README.md' });

  if (read.kind !== 'ref') throw new Error('Expected static Files read to return a content ref.');
  const asset = await fetch(read.contentRef.url);
  const text = await asset.text();
} finally {
  files.dispose('test.cleanup');
}
```

Use `.cmd` deliberately here. Static reads return `ref`, so `readText(...)` is the wrong facade for
this sample. That contrast is part of the lesson.

## Assertions

Minimum test proof:

- the sample server serves `/dist.json` over plain HTTP;
- `Pkg.Dist.fetch({ origin })` loads the checked-in `dist.json`;
- `FilesStatic.fromDist({ dist, baseUrl, policy })` creates a bounded static Files backing;
- `Files.Client.local(backing)` works over the static backing;
- `files.cmd.send(Files.Cmd.Name.manifest, { content: true })` returns Files entries and URL content
  refs, not `DistPkg`;
- `files.cmd.send(Files.Cmd.Name.read, { path })` returns `kind: 'ref'` with a URL content ref;
- fetching the content-ref URL from the same static HTTP origin returns the real static asset;
- no WebSocket server is involved;
- no HTTP Cmd server/client is involved.

## Non-goals

- Do not add another `FilesServer.WebSocket` sample for static dist.
- Do not introduce an HTTP Cmd Files server sample in this pass.
- Do not make static Files `readText(...)` work by fetching content refs; that is a separate facade
  design question.
- Do not add a build pipeline just to generate the sample `dist.json` unless a later package already
  owns a deterministic fixture generator.
- Do not widen static Files authority beyond readonly/list/stat/read/manifest snapshot behavior.

## Acceptance

- `code/sys/http` check/test includes the sample path without broad permissions.
- A task can start the sample static server.
- A behavior test proves the published/static runtime path from `dist.json` to Files manifest/read-ref
  to plain HTTP asset fetch.
- README explains the contrast with `@sys/server/-sample/files.websocket`:
  - websocket sample = live authoring/dev mode;
  - static sample = generated dist/runtime publication mode.

## Suggested commit shape

```text
sample(http): add static Files dist sample

- add a checked-in dist.json fixture and static assets
- start a plain @sys/http static server for the fixture bundle
- prove a client can fetch dist.json, reconstruct a FilesStatic backing, and follow URL content refs
```
