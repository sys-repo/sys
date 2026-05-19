# Plan: FilesStatic HTTP/dist Cmd integration proof

## Status

Implemented and committed. This remains a separate seam proof, not runtime model/static behavior.

Implementation commit:

```text
93eaf2e03 test(http): prove static dist files capability over HTTP
```

Implementation files:

```text
/Users/phil/code/org.sys/sys/code/sys/http/deno.json
/Users/phil/code/org.sys/sys/code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts
```

Primary test file:

```text
/Users/phil/code/org.sys/sys/code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts
```

## Absolute path

```text
/Users/phil/code/org.sys/sys/-agent/files-static-http-cmd-integration.plan.md
```

## Question being answered

Do we have a real HTTP-server-backed proof that a canonical `dist.json` can be fetched, adapted into a
static Files capability, and exercised through the Files Cmd client shape?

Current answer: yes. The composed HTTP/dist → FilesStatic → HttpCmd client proof is implemented in
`@sys/http` tests.

Existing separate proofs:

```text
@sys/std
  Testing.Http.server(...) + Pkg.Dist.fetch(...)
  → code/sys/std/src/m.Pkg/-test/-m.Dist.test.ts

@sys/model/files/static
  FilesStatic.fromDist({ dist, baseUrl?, policy?, defaultLimit? })
  → list/stat/read/manifest, match/exclude/depth, refs, policy, errors
  → code/sys.model/model/src/m.files.static/-test/-m.fromDist.test.ts

@sys/server/files
  Files backing over real WebSocket Cmd client
  → code/sys/server/src/files/-test/-m.WebSocket.create.test.ts
```

Implemented composed proof:

```text
Testing.Http.server serves /dist.json and /cmd
→ Pkg.Dist.fetch({ origin }) loads canonical dist metadata over real HTTP
→ FilesStatic.fromDist({ dist: res.dist, baseUrl: origin, policy }) creates a pure snapshot backing
→ HttpCmd.client<Files.Cmd.*>({ url: `${origin}/cmd`, ns: Files.Cmd.ns }) sends real Cmd HTTP JSON calls
→ capabilities/list/stat/read/manifest work over static refs
```

## STIER boundary

Do **not** add HTTP fetching to `@sys/model/files/static`.

The model/static adapter must remain pure:

```text
input:  t.DistPkg
output: Files backing with Cmd handlers
no fetch
no host IO
no server dependency
no @sys/http dependency
```

The integration proof composes already-existing public surfaces. It should prove the seams without
moving authority into the model.

## Reviewed BMIND/TMIND design decision

Implement this as a **test-only integration proof** in `@sys/http`:

```text
/Users/phil/code/org.sys/sys/code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts
```

Why this home:

- The seam under test is `@sys/http` command transport plus real HTTP dist loading.
- `@sys/model/files/static` already proves pure static backing behavior and must not learn to fetch.
- `@sys/server/files` already proves WebSocket serving of a structural Files backing; pulling WebSocket into this proof would test a different seam.
- No new runtime module or export is needed.

The test may import `@sys/model/files`, `@sys/model/files/static`, and `@sys/std/pkg` as test-only collaborators. Runtime `@sys/http` APIs do not gain a model dependency.

Optional later WebSocket composition remains separate:

```text
FilesStatic backing
→ FilesServer.WebSocket.create(...)
→ remote WebSocket Files Cmd client
```

That optional stronger proof belongs in `@sys/server/files`, not in this HTTP test.

## Test fixture

Use a tiny canonical `t.DistPkg` with three demonstrative files:

```text
foo.json
notes/baz.md
docs/read me.md
```

The space in `docs/read me.md` is intentional: it proves URL path-segment encoding in content refs.

Serve two HTTP routes from one real `Testing.Http.server(...)` instance:

```text
GET  /dist.json  → canonical t.DistPkg fixture
POST /cmd        → HttpCmd.handle(... FilesStatic backing handlers ...)
```

Do not serve file bodies. The body data plane is intentionally absent; the proof should show that Files Cmd
structural operations complete by returning content refs only.

Keep a request log/counter so the test can assert that no `GET /foo.json`, `GET /notes/baz.md`, or
`GET /docs/read%20me.md` body request occurred.

## Acceptance criteria

The test must prove, through a real `HttpCmd.client`:

- real test HTTP server serves a canonical `dist.json`;
- `Pkg.Dist.fetch({ origin })` returns `ok: true` and a `t.DistPkg`;
- `FilesStatic.fromDist({ dist, baseUrl: origin, policy })` creates a snapshot backing;
- `HttpCmd.client<t.Files.Cmd.Name, t.Files.Cmd.Payload, t.Files.Cmd.Result>(...)` sends calls to `/cmd`;
- Files Cmd calls succeed for:
  - `files:capabilities`;
  - `files:list`;
  - `files:stat`;
  - `files:read` returning `kind: 'ref'` with URL content refs;
  - `files:manifest` with content refs;
- list filters compose over the static capability:
  - `match`;
  - `exclude`;
  - scoped `path` + `depth`;
- URL refs are rooted at the HTTP server origin;
- URL refs encode path segments, specifically `docs/read me.md` → `/docs/read%20me.md`;
- denied files do not appear when policy denies one of the three fixture files;
- `files:watch` fails as `CmdError.Remote` because static fidelity does not support watch;
- request logging proves no static file body route was fetched to satisfy Cmd structural operations.

## Non-goals

- Do not add `FilesStatic.fromUrl(...)` in this pass.
- Do not fetch file bodies through FilesStatic.
- Do not introduce `@sys/http` or `@sys/server` imports into model/static runtime graph.
- Do not invent a second static manifest schema; `t.DistPkg` remains the static distribution input.

## Implementation sketch

Test-only pseudo-flow:

```ts
const dist = sampleDist({
  'foo.json': '<hash>:size=16',
  'notes/baz.md': '<hash>:size=6',
  'docs/read me.md': '<hash>:size=9',
});
const requests: string[] = [];
let backing: t.FilesStatic.Readonly | undefined;

const server = Testing.Http.server((request) => {
  const url = new URL(request.url);
  requests.push(`${request.method} ${url.pathname}`);

  if (request.method === 'GET' && url.pathname === '/dist.json') {
    return Testing.Http.json(dist);
  }

  if (url.pathname === '/cmd') {
    if (!backing) throw new Error('FilesStatic backing not initialized.');
    return HttpCmd.handle(request, {
      path: '/cmd',
      cmd: { ns: Files.Cmd.ns, handlers: backing.handlers },
    });
  }

  return new Response('Not found', { status: 404 });
});

const fetched = await Pkg.Dist.fetch({ origin: server.url.toURL().origin });
backing = FilesStatic.fromDist({ dist: fetched.dist!, baseUrl: server.url.toURL().origin, policy });
const client = HttpCmd.client<Files.Cmd.Name, Files.Cmd.Payload, Files.Cmd.Result>({
  url: `${server.url.toURL().origin}/cmd` as t.StringUrl,
  ns: Files.Cmd.ns,
});
```

Prefer local test helpers only if they keep the assertion body clearer. Do not create production helpers for this proof.

## Delivered commit

```text
93eaf2e03 test(http): prove static dist files capability over HTTP
```

Files in commit:

```text
code/sys/http/deno.json
code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts
```

## Validation

Run the owning `@sys/http` package validation:

```text
cd /Users/phil/code/org.sys/sys/code/sys/http
deno fmt --check deno.json src/http.cmd/-test/-static-dist-files.test.ts
deno task check
deno task test --trace-leaks ./src/http.cmd/-test/-static-dist-files.test.ts
deno task test
deno task dry
```

If implementation touches only the new test file, the targeted test plus full `deno task test` is enough for the seam proof; no `@sys/model` runtime validation should be necessary because the model adapter is unchanged.

## Implementation result

Implemented as a single test-only integration proof under `@sys/http` in commit
`93eaf2e03 test(http): prove static dist files capability over HTTP`:

```text
code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts
```

The test uses one real `Testing.Http.server(...)` instance with:

```text
GET  /dist.json
POST /cmd
```

It proves:

- `Pkg.Dist.fetch({ origin })` loads canonical dist metadata over real HTTP;
- `FilesStatic.fromDist({ dist, baseUrl: origin, policy })` creates a pure static snapshot backing;
- `HttpCmd.client<Files.Cmd.*>` calls `files:capabilities`, `files:list`, `files:stat`, `files:read`,
  `files:manifest`, and `files:watch` over real HTTP Cmd JSON;
- match/exclude/scoped-depth list filters work through the HTTP Cmd client;
- denied static files are omitted and denied reads cross as `CmdError.Remote`;
- URL content refs are rooted at the test server origin and encode `docs/read me.md` as
  `docs/read%20me.md`;
- only `GET /dist.json` is fetched as a body route; file bodies are not fetched.

Validation passed:

```text
cd /Users/phil/code/org.sys/sys/code/sys/http
deno fmt --check deno.json src/http.cmd/-test/-static-dist-files.test.ts
deno task check
deno task test --trace-leaks ./src/http.cmd/-test/-static-dist-files.test.ts
deno task test
deno task dry
```

## Final STIER note

This proof is about seam reality, not new authority. The durable architecture remains:

```text
@sys/std/pkg              fetches/parses canonical dist.json
@sys/model/files/static   adapts a provided t.DistPkg into a static Files capability
@sys/server/files         optionally serves any Files backing over WebSocket Cmd
```

The composed test should make that story obvious to a future reader without weakening the model boundary.
