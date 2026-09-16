# R2 + Deno

A private workspace application sample: Deno serves a built UI through authenticated R2 reads and a
JSON endpoint on one origin. The UI requests `/api/hello?msg=hello` and renders `hello world!` as
text.

## Read the application

- [`src/u.app.ts`](src/u.app.ts) composes `HttpServer` and `R2.ReadRoute`.
- [`src/u.selection.ts`](src/u.selection.ts) validates local authority and maps filenames to R2
  keys.
- [`src/entry.ts`](src/entry.ts) loads package-local data and resolves serving credentials.
  Importing it does not open a listener or read credentials; local and staged startup call the same
  `main`.
- [`ui/entry.tsx`](ui/entry.tsx) contains the view and its single API request.

| Request                         | Result                                             |
| ------------------------------- | -------------------------------------------------- |
| `GET/HEAD /ui`                  | `308` → `/ui/`; queries are refused                |
| `GET/HEAD /ui/`                 | Selected `index.html`                              |
| `GET/HEAD /ui/<admitted-file>`  | Exact selected file                                |
| `GET/HEAD /api/hello?msg=hello` | JSON `{ "msg": "hello world!" }`; HEAD has no body |
| Other paths                     | `404`, never fallback HTML                         |

The API accepts one optional `msg`, defaults to `hello`, and allows at most 128 UTF-16 code units.
Duplicate or extra query parameters return `400`. Unsupported methods return `405`. Responses use
`no-store` and `nosniff`; CORS is disabled. API requests and pre-admission refusals do not read R2.
UI HEAD requests acquire the object just like GET, then omit the response body.

## Local authority

`config.json` selects the existing `sys-test` bucket and a separate `tmp.sys.tools/r2-ui-proof`
prefix for this application. The historical `tmp.sys.tools/r2-proof` objects are not changed. The
configuration contains credential **names**, never values, and fixed read budgets: 1 MiB, 5 seconds,
four concurrent operations per shared UI handler. These are not deployment-wide traffic, memory or
spending limits. Startup reads configuration and artifact JSON through `Fs.Snapshot`, bounded to 64
KiB and 5 seconds per file.

The build verifies `dist/` with `Pkg.Dist.Local.verify`, then writes `artifact.json`: the manifest
checksum and admitted filenames, including `dist.json`. Only that local selection can become public
under `/ui/`; R2 listing and remote manifests do not extend it. Anonymous application reads are
explicitly authorized over this map, while signing credentials and presigned URLs stay server-side.
The manifest checksum records build identity; it does **not** verify each later R2 response.

## Owning tasks

Run from `code/sys.driver/driver-cloudflare/-sample/deploy`:

```sh
deno task build
deno task push
deno task start
```

Then open `http://127.0.0.1:8080/ui/`. `push` writes to R2; `start` only serves reads. If the
selected build already exists, run `push` without rebuilding it. `stage` is separate Deno-hosting
preparation, not a requirement for this local workflow.

Startup uses the standard `HttpServer` URL table to list `/`, `/ui/` and `/api/hello?msg=hello`. The
`start` task opts into Deno's `--unstable-no-legacy-abort` behavior: successful response completion
is not a request abort. This does not suppress other warnings; Deno may still report that named
permission presets are experimental.

| Task    | Effect                                                                     |
| ------- | -------------------------------------------------------------------------- |
| `test`  | Exercise the handler and bounded local-data reads with fixtures            |
| `build` | Build UI → verify Dist → write `artifact.json`                             |
| `push`  | Verify the selected Dist → upload through the existing R2 publisher        |
| `stage` | Rebuild, materialize the Deno stage, record its paths in `.tmp/stage.json` |
| `start` | Use the shared entry; listen strictly on `127.0.0.1:8080`                  |

`build` and `stage` share the `build` permission preset: filesystem reads/writes, environment
access, Deno subprocesses and native-library loading (`ffi`). Treat build dependencies as trusted;
native code is not confined by Deno's JavaScript permission checks. The Vite driver configures its
compiler subprocess's own permissions.

`test` uses local filesystem/environment permissions, without network, subprocess or FFI access.
`push` permits filesystem reads/writes, environment access and the configured R2 HTTPS hostname; it
does not build, spawn subprocesses or load native build tools. `start` permits filesystem and
environment access, `127.0.0.1:8080`, and the configured R2 hostname on HTTPS port 443. Environment
access includes dependency startup checks as well as credentials; this trusted local sample does not
maintain an exhaustive environment-variable allowlist.

**Current proof boundary:** tests exercise the real handler with fixture storage. Built-browser,
external staged-entry, graph ownership and parent publication-exclusion proofs remain outstanding.
Passing fixture tests does not establish live R2 or hosted execution.

## Push

`push` reads the same `config.json` as the application, verifies `dist/` against the checksum and
filenames in `artifact.json`, then calls `Deploy.push` from `@sys/tools/deploy`. It generates
`.tmp/push.yaml` with environment-variable references only. The existing uploader resolves those
references through the upward `@sys/fs/env` loader. There is no separate hand-maintained upload
configuration and no dependency on the old proof's `.tmp` files.

**Push is a remote mutation:** the publisher writes changed files, writes `dist.json` last, and
prunes stale objects inside the configured bucket/prefix. Use only the selected disposable sample
prefix; never point it at the bucket root or an unrelated application's files. There is no forced
repair, automatic retry, build or stage step. Keep `dist/`, `artifact.json` and configuration
unchanged during push. Preflight verification is not an atomic snapshot of later publisher reads. A
failed push can leave partial changes; a successful push is not byte-readback or browser proof.

## Live reads and retention

`start` runs the real R2-backed application, not a fixture server. It uses `Env.load` from
`@sys/fs/env`, searching upward from the sample directory for `.env` files, just like the existing
Deploy tooling. The repository-root `.env` supplies the existing `SYS_TEST_R2_ACCESS_KEY_ID` and
`SYS_TEST_R2_SECRET_ACCESS_KEY` references. Nearer dotenv values override ancestor values; the
reader falls back to process environment for names absent from dotenv. No manual export is needed.
The reader is passed into the shared entry without exporting dotenv secrets into process
environment.

Hosted entry calls use platform-provided environment variables instead; they do not discover local
dotenv files. Keep secrets out of the stage, browser assets and logs. The reused test credentials
were used for upload in the earlier proof; they are not claimed to be read-only serving credentials.
Select hosted serving credentials separately before deployment.

Starting the server does not upload files. `/ui/` requires the matching selected Dist to have been
uploaded to the configured prefix through the existing uploader. The test bucket's public-access
settings are not verified here; startup does not configure the provider or make a bucket private.

Staging rebuilds: retain the matching stage, `artifact.json` and complete `dist/` **after** it
succeeds. The operator owns their retention and the matching R2 objects. A new build is a new
candidate requiring selection and proof. Uploads and hosted exposure require separate authorization.
Deploy a retained stage through the existing `DenoDeploy.prepare`/`deploy` surfaces, not another
build-and-stage pass. Replacement or rollback must preserve a matching retained application and
object set; this sample does not orchestrate either.
