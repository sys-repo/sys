# R2 + Deno

## Purpose

A workspace sample with one application origin: Deno serves built UI assets from R2 and a JSON API.
The browser calls the API and renders `hello world!`.

## Run

Use an existing R2 bucket and a dedicated prefix you control. [config.json](config.json) currently
selects bucket `sys-test` and prefix `tmp.sys.tools/r2-ui-proof`. If changing accounts, also update
the matching R2 hostnames in the `push` and `serve` network grants in [deno.json](deno.json).

Provide the configured credentials in the repository-root `.env` or process environment:

- `SYS_TEST_R2_ACCESS_KEY_ID`
- `SYS_TEST_R2_SECRET_ACCESS_KEY`

Publishing requires read, list, write and delete access to the selected target.

**`push` writes to R2 and deletes objects in the configured prefix that are absent from the selected
build.** Do not use a prefix shared with unrelated files.

From `code/sys.driver/driver-cloudflare/-sample/deploy`:

```sh
deno task build
deno task push
deno task serve
```

- `build` creates `dist/` and records the build selection in `artifact.json`.
- `push` verifies and publishes that existing build without rebuilding it.
- `serve` serves the application on port 8080; it does not upload files.

Open:

- UI: <http://127.0.0.1:8080/ui/>
- API: <http://127.0.0.1:8080/api/hello>

`deno task test` runs fixture tests, not live R2 requests.

For a read-only live check, stop `serve` and run `deno task proof:local`. It starts and closes its
own listener on `127.0.0.1:8080`, reports the configured target and current `artifact.json` pin, and
compares served files with verified local bytes. Each invocation selects the current build;
expectations do not change during that run. A mismatch fails without rebuilding, uploading, or
retrying. Keep `dist/`, `artifact.json` and `config.json` unchanged during the check. This checks
HTTP delivery, not browser rendering or bucket privacy.

## Boundaries

Application routes require no login; R2 credentials stay server-side. This sample does not configure
bucket privacy.

Only the selected filenames are served under `/ui/`. The recorded build checksum does not verify
individual R2 responses.

Publishing is not atomic. A failed push can leave partial changes, with no automatic rollback. Keep
`dist/`, `artifact.json` and `config.json` unchanged during publication.
