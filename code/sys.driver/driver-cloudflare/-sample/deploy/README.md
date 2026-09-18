# @sample/r2 — Deno application with R2 assets

Deno serves the API and delivers UI assets stored in Cloudflare R2. The browser uses one application
origin; it does not fetch assets directly from R2.

For each UI asset, Deno uses a
[short-lived presigned URL](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) to fetch
the object and return its bytes. The URL and R2 credentials stay server-side.

## Run

Use an existing R2 bucket and a dedicated prefix you control. [config.json](config.json) currently
selects bucket `sys-test` and prefix `tmp.sys.tools/r2-ui-proof`. If changing accounts, also update
the matching R2 hostnames in the `push` and `serve` network grants in [deno.json](deno.json).

Provide the configured credentials in the repository-root `.env` or process environment:

- `SYS_TEST_R2_ACCESS_KEY_ID`
- `SYS_TEST_R2_SECRET_ACCESS_KEY`

Run tasks from `code/sys.driver/driver-cloudflare/-sample/deploy`:

- `build` creates `dist/` and records its filenames and manifest checksum in `artifact.json`.
- `push` verifies and publishes that build without rebuilding it.
- `serve` serves the application on `127.0.0.1:8080`; it does not upload files.

For an already-published build, run only `deno task serve`. Valid `artifact.json`, `config.json`,
and credentials are still required; local `dist/` is optional for serving.

Publishing requires read, list, write, and delete access to the selected target.

**`push` writes to R2 and deletes objects in the configured prefix that are absent from the selected
build.** Do not use a prefix shared with unrelated files.

Publishing is not atomic. A failed push can leave partial changes, with no automatic rollback. Keep
`dist/`, `artifact.json`, and `config.json` unchanged during publication.

To publish a new build and start the application:

```sh
deno task build
deno task push
deno task serve
```

Open the UI at <http://127.0.0.1:8080/ui/>. It displays the API message and the manifest’s
`hash.digest`.

- API: <http://127.0.0.1:8080/api/hello>
- Asset manifest: <http://127.0.0.1:8080/ui/dist.json>

## Build selection

The application takes its filename selection from `artifact.json` and its asset bytes from R2.

| Value         | Source           | Meaning                                              |
| ------------- | ---------------- | ---------------------------------------------------- |
| `files`       | `artifact.json`  | Filenames allowed under `/ui/`.                      |
| `integrity`   | `artifact.json`  | Checksum of `dist/dist.json` for local verification. |
| `hash.digest` | `dist/dist.json` | Local build digest shown at server startup.          |
| `hash.digest` | `/ui/dist.json`  | R2-served build digest shown in the browser.         |

The startup `build` row is a snapshot of the verified local build, not a check of R2. Missing or
mismatched local output is shown as unavailable; it does not prevent serving.

In supporting terminals, `dist/` links to the local directory and the shortened digest links to its
`dist.json`.

Serving does not compare individual R2 responses with the local build. Displaying the manifest’s
digest does not verify the downloaded assets.

## Verify delivery

`deno task test` runs fixture tests without live R2 requests.

For a read-only check against R2, stop `serve`, then run:

```sh
deno task proof:local
```

Each run uses the build selected in `artifact.json` and holds its verified local bytes fixed for
comparison. The check starts its own listener on `127.0.0.1:8080`, compares the served files with
those bytes, and closes the listener when finished. It reports the configured R2 target and manifest
checksum.

A mismatch fails without rebuilding, uploading, or retrying. Keep `dist/`, `artifact.json`, and
`config.json` unchanged during the check. This checks HTTP delivery, not browser rendering or bucket
privacy.

## Access

Application routes require no login. This sample does not configure bucket privacy.
