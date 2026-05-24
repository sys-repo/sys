# Files static sample plan

Thread title: `/files-static-sample`

## BMIND final review

Assessment: **landed**.

Commit:

```text
62958485b sample(server): add static Files dist sample
```

Implementation added:

```text
code/sys/server/-sample/files.static/
  -config.ts
  -start.ts
  common.ts
  t.ts
  dist/
    dist.json
    hello.txt
    hello.json
    docs/README.md
  docs/README.md
  -.test.ts
```

Validation passed:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/server
deno test -P=test ./-sample/files.static/-.test.ts ./-sample/files.websocket/-.test.ts
deno task check
deno task test
```

Result:

```text
18 passed
0 failed
```

This plan is STIER-clean because each primitive has one job and every sample file teaches one
architectural boundary. The sample is valuable precisely because it does not add another transport
or server abstraction; it demonstrates that the generated `dist.json` artifact can be consumed
through the same Files model without pretending static publication behaves like live inline reads.

Quality checks:

- **Boundary-correct:** `@sys/http/server/static` serves bytes; `Pkg.Dist.fetch(...)` owns dist
  metadata; `FilesStatic.fromDist(...)` owns the only `DistPkg` → Files backing seam;
  `Files.Client.local(...)` owns the in-process client binding.
- **Pedagogy-correct:** the structure mirrors `files.websocket`, while the content teaches the
  opposite lifecycle mode: generated/static publication instead of dynamic/live authoring.
- **Facade-correct:** the WebSocket sample can use `readText(...)`; this static sample should use
  `files.cmd.send(Files.Cmd.Name.read, ...)` because static reads intentionally return content refs.
- **Test-correct:** behavior proof should start `HttpStatic` in-process on port `0`; no process
  spawn, no WebSocket, no HTTP Cmd.
- **Authority-correct:** readonly policy only; no filesystem capability adapter; no
  write/watch/remove implication.

Implementation gotchas:

- Use `server.origin` when constructing `baseUrl` in tests to avoid `127.0.0.1` vs `localhost`
  display mismatches.
- Keep `dist.json` honest: real sizes and real SHA-256 hashes for the checked-in assets.
- Assert the returned content ref is a URL ref before fetching it.
- Keep `DistPkg` out of assertions after `FilesStatic.fromDist(...)`; assert Files manifest/read
  shapes instead.

## BMIND design review

This is the highest-value next sample because it proves the other end of the Files lifecycle from
the tidied WebSocket sample.

The existing sample now has the right simple shape:

```text
code/sys/server/-sample/files.websocket/
  -config.ts    # sample-owned constants/policy/root
  -start.ts     # executable lifecycle
  common.ts     # public-library imports + defaults
  t.ts          # local type barrel
  docs/         # served corpus + README
  -.test.ts     # behavior proof
```

It proves live authoring/dev mode:

```text
host filesystem
→ bounded Files/fs live backing
→ Files WebSocket server
→ Files client handle
→ readText(...)
```

The missing sample should mirror that structure, not the content. It should prove published/static
runtime mode:

```text
dist.json + static assets
→ plain @sys/http static server
→ client fetches dist.json
→ FilesStatic.fromDist({ dist, baseUrl, policy })
→ Files.Client.local(static backing)
→ manifest/list/stat/read-ref
→ content refs fetch plain HTTP assets
```

The important architectural contrast:

- WebSocket sample: dynamic, live, authoring/dev server, filesystem-backed, humane `readText(...)`.
- Static sample: generated, immutable-ish runtime publication, `dist.json`-backed, raw Files Cmd
  read-ref semantics.

This is not complicated code. The sophistication is in showing that the same Files model can span
live message-passing authoring and static publication without collapsing their semantics.

## Ownership decision

Implement the runtime sample adjacent to the existing server Files sample.

Preferred location:

```text
code/sys/server/-sample/files.static/
```

Reasoning:

- `@sys/server/-sample/files.websocket` owns the live Files-over-WebSocket sample story.
- `@sys/server/-sample/files.static` sits beside it as the generated/static publication story.
- The sample may import `@sys/http/server/static`; that is composition at sample scope, not
  production `@sys/server` coupling.
- `@sys/http/server/static` still owns plain static HTTP serving.
- `FilesStatic.fromDist(...)` owns the `dist.json` → Files backing seam.
- A static-dist-over-WebSocket sample would repeat the transport proof and miss the point.

This plan lives under `-agent/-plan/cmd.files` because it closes the Files architecture arc.

## Primitive discipline

Use each `@sys/*` primitive at its narrowest owner seam:

- `@sys/http/server/static` / `HttpStatic.start(...)`: owns serving the checked-in bundle as plain
  static HTTP. Use the standard HTTP lifecycle handle; do not add sample-local server plumbing.
- `@sys/std/pkg` / `Pkg.Dist.fetch(...)`: owns fetching and validating `dist.json`. Do not hand-roll
  `fetch('/dist.json').then(res => res.json())` in the sample or test.
- `@sys/model/files/static` / `FilesStatic.fromDist(...)`: owns the only production `DistPkg` →
  Files backing seam. `DistPkg` should not leak into Files command results.
- `@sys/model/files` / `Files.Policy`, `Files.Client.local`, `Files.Cmd.Name`: owns the generic
  Files grammar and client handle. Import this generic package, not `@sys/model/files/fs`.
- `@sys/fs` / `Fs.Path.fromFileUrl(...)`: only for converting sample-relative file URLs into stable
  local paths. Do not use filesystem capability adapters in this static sample.
- `@sys/testing/server`: use the package test barrel via `src/-test.ts`; start `HttpStatic`
  in-process on port `0` for behavior tests.

Explicitly avoid these primitives in this sample:

- `@sys/server/files` and `FilesServer.WebSocket`: already covered by `files.websocket`.
- `@sys/http/cmd` / `HttpCmd`: reserve for the later HTTP Cmd transport sample.
- `@sys/process` / `Process.spawn`: unnecessary for this behavior proof.
- `@sys/model/files/fs`: this is not a filesystem-backed Files sample.

Pedagogy rule: every imported primitive should correspond to one box in the sample diagram. If an
import does not explain `dist.json → static HTTP → FilesStatic → Files client → content ref`, remove
it.

## Naming

Use `static`, not `dist`, in task and directory names.

- `static` is the public Files backing concept.
- `dist.json` is the input artifact.
- Avoid `http` for now because `sample:files:http` reads like HTTP Cmd transport, and that transport
  still has fidelity work open.

Suggested `code/sys/server/deno.json` additions:

```json
{
  "tasks": {
    "sample:files": "deno task sample:files:static",
    "sample:files:static": "deno run -P=sample-files-static ./-sample/files.static/-start.ts"
  },
  "permissions": {
    "sample-files-static": {
      "read": true,
      "net": true
    }
  }
}
```

Also include the sample path in the package check task, narrowly:

```json
"check": "deno check -- ./src/ ./-scripts/* ./-sample/files.static/*"
```

If broader `./-sample/*` coverage already exists by implementation time, use the package convention.
Do not add broad permissions just for the sample.

## Structure

Mirror the now-clean WebSocket sample skeleton:

```text
code/sys/server/-sample/files.static/
  -config.ts
  -start.ts
  common.ts
  t.ts
  dist/
    dist.json
    hello.txt
    hello.json
    docs/README.md
  docs/README.md
  -.test.ts
```

Keep `-config.ts` separate from `-start.ts`.

This split is intentional and should match the WebSocket sample:

- `-config.ts` owns sample constants: name, port, dist root, policy, notable paths.
- `-start.ts` owns executable lifecycle: start the static HTTP server and wait.

Do not merge them for terseness. The split makes the sample copyable and keeps runtime side effects
out of the config module.

## Suggested module roles

### `common.ts`

Keep it as a tiny sample import barrel, comparable to the WebSocket sample.

Likely exports:

```ts
import type * as t from './t.ts';

export type { t };

export { Fs } from '@sys/fs';
export { HttpStatic } from '@sys/http/server/static';
export { Files } from '@sys/model/files';
export { FilesStatic } from '@sys/model/files/static';
export { Pkg } from '@sys/std/pkg';

const port = 1235;
export const DEFAULTS = {
  name: '@sys/server:sample:files:static',
  port,
  url: `http://127.0.0.1:${port}`,
  dist: '/dist.json',
} as const;

export const D = DEFAULTS;
```

Use a port distinct from the WebSocket sample's `1234`.

### `t.ts`

Keep a flat local type barrel:

```ts
export type * from '@sys/http/t';
export type * from '@sys/model/files/t';
export type * from '@sys/model/files/static/t';
export type * from '@sys/types';
```

### `-config.ts`

Own sample constants and policy:

```ts
import { D, Files, Fs } from './common.ts';

const root = Fs.Path.fromFileUrl(new URL('./dist', import.meta.url));
const policy = Files.Policy.readonly('**');

/** Sample-owned config for the static Files publication server. */
export const SampleFiles = {
  name: D.name,
  port: D.port,
  root,
  policy,
  paths: {
    dist: D.dist,
    readme: 'docs/README.md',
  },
} as const;
```

### `-start.ts`

Start a plain static HTTP server. Do not involve WebSocket and do not involve HTTP Cmd.

`HttpStatic.start(...)` currently exposes the standard HTTP lifecycle surface with `until`, not the
WebSocket sample's `lifecycle: 'process'` option. Use the actual owner API:

```ts
import { SampleFiles } from './-config.ts';
import { HttpStatic } from './common.ts';

const server = await HttpStatic.start({
  dir: SampleFiles.root,
  hostname: '127.0.0.1',
  port: SampleFiles.port,
  keyboard: true,
  name: SampleFiles.name,
  info: { dist: SampleFiles.paths.dist },
});

await server.finished;
```

If startup output/keyboard options differ during implementation, follow `HttpStatic.start(...)` as
owned by `@sys/http`. Do not invent sample-local lifecycle plumbing.

## Static fixture bundle

`dist/` should be tiny and checked in.

It does not need a build pipeline for this first sample. The contract is the shape:

```text
dist/
  dist.json
  hello.txt
  hello.json
  docs/README.md
```

Keep sizes and hashes deterministic. For a public sample, prefer real SHA-256 hashes for the
checked-in asset bytes rather than fixture-looking fake hashes. Hand-authored metadata is acceptable
only if it is honest and matches the files in `dist/`.

The sample should not need to fetch the assets while building the Files backing. Static Files should
translate `dist.json` into Files entries/content refs. Actual asset bytes are fetched only when the
client follows a returned URL content ref.

## Behavior test

Prefer an in-process behavior test over process-spawning the task.

The WebSocket sample needs process spawning because it proves a long-running sample executable and
WebSocket readiness. The static sample's contract is cleaner if the test starts
`HttpStatic.start(...)` directly on port `0` and uses `server.origin`.

Sketch:

```ts
import { SampleFiles } from '../-config.ts';
import { describe, expect, it } from '../../../src/-test.ts';
import { Files, FilesStatic, HttpStatic, Pkg, type t } from '../common.ts';

describe('sample:files:static', () => {
  it('serves dist.json and reconstructs static Files content refs over plain HTTP', async () => {
    const server = await HttpStatic.start({
      dir: SampleFiles.root,
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
      name: SampleFiles.name,
      info: { dist: SampleFiles.paths.dist },
    });

    let files: t.Files.Client.Local | undefined;

    try {
      const origin = server.origin as t.StringUrl;
      const fetched = await Pkg.Dist.fetch({ origin });
      expect(fetched.ok).to.eql(true);
      expect(fetched.href).to.eql(`${origin}/dist.json`);
      if (!fetched.dist) throw new Error('Expected dist.json.');

      const backing = FilesStatic.fromDist({
        dist: fetched.dist,
        baseUrl: origin,
        policy: SampleFiles.policy,
      });
      files = Files.Client.local(backing);

      const manifest = await files.cmd.send(Files.Cmd.Name.manifest, { content: true });
      expect(manifest.version).to.eql('sys.files.manifest.v1');
      expect(manifest.content?.length).to.be.greaterThan(0);

      const read = await files.cmd.send(Files.Cmd.Name.read, { path: SampleFiles.paths.readme });
      expect(read.kind).to.eql('ref');
      if (read.kind !== 'ref') throw new Error('Expected static Files read to return a ref.');
      expect(read.contentRef.kind).to.eql('url');

      const asset = await fetch(read.contentRef.url);
      expect(asset.status).to.eql(200);
      expect(await asset.text()).to.contain('Files static sample');
    } finally {
      files?.dispose('test.cleanup');
      await server.close('test.cleanup');
      await server.finished;
    }
  });
});
```

Use `.cmd` deliberately. Static reads return `kind: 'ref'`; `readText(...)` intentionally throws for
content refs today. That contrast with the WebSocket sample is part of the architecture lesson.

## Assertions

Minimum proof:

- the static sample server serves `/dist.json` over plain HTTP;
- `Pkg.Dist.fetch({ origin })` loads the checked-in `dist.json`;
- `FilesStatic.fromDist({ dist, baseUrl, policy })` creates a bounded static Files backing;
- `Files.Client.local(backing)` binds the backing through the same client-handle architecture;
- `files.cmd.send(Files.Cmd.Name.manifest, { content: true })` returns Files manifest entries and
  URL content refs, not `DistPkg`;
- `files.cmd.send(Files.Cmd.Name.read, { path })` returns `kind: 'ref'` with a URL content ref;
- fetching the returned content-ref URL from the same static origin returns the real static asset;
- no WebSocket server is involved;
- no HTTP Cmd server/client is involved.

## Docs

`docs/README.md` should be short and architectural, like the WebSocket sample README.

It should show:

```ts
const fetched = await Pkg.Dist.fetch({ origin });
const backing = FilesStatic.fromDist({ dist: fetched.dist, baseUrl: origin, policy });
const files = Files.Client.local(backing);
const read = await files.cmd.send(Files.Cmd.Name.read, { path: 'docs/README.md' });
```

And explain:

```text
dist.json → FilesStatic backing → Files client → read-ref → plain HTTP asset
```

Also explicitly contrast:

```text
files.websocket = live authoring/dev mode over WebSocket
files.static    = generated publication/runtime mode over static HTTP
```

Do not show `readText(...)` as the primary static sample API until/unless the client facade grows
explicit content-ref following semantics.

## Non-goals

- Do not add another `FilesServer.WebSocket` sample for static dist.
- Do not introduce an HTTP Cmd Files server/client sample in this pass.
- Do not name this sample `files.http`; reserve that for a future HTTP Cmd transport sample if/when
  transport fidelity is hardened.
- Do not make static Files `readText(...)` work by fetching content refs in this pass.
- Do not add a build pipeline just to generate the sample `dist.json` unless a later package already
  owns a deterministic fixture generator.
- Do not widen static Files authority beyond readonly/list/stat/read/manifest snapshot behavior.

## Acceptance

- `code/sys/server/-sample/files.static` mirrors the clean sample structure of
  `code/sys/server/-sample/files.websocket`.
- `deno task check` in `code/sys/server` includes the sample files.
- `deno task test` in `code/sys/server` includes the sample behavior test.
- `deno task sample:files:static` starts a plain static HTTP server for the checked-in bundle.
- The behavior test proves the published/static runtime path from `dist.json` to Files
  manifest/read-ref to plain HTTP asset fetch.
- The README makes the live-authoring vs generated-publication split obvious.

## Suggested commit shape

```text
sample(server): add static Files dist sample

- add a checked-in dist.json fixture and static assets
- start a plain @sys/http static server for the fixture bundle
- prove a client can fetch dist.json, reconstruct a FilesStatic backing, and follow URL content refs
```
