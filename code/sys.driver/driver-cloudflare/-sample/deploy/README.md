# @sample/r2 — Deno application with R2 assets

Deno serves the API and delivers UI assets stored in Cloudflare R2. The browser uses one application
origin; it does not fetch assets directly from R2.

For each UI asset, Deno uses a
[short-lived presigned URL](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) to fetch
the object and return its bytes. The URL and R2 credentials stay server-side.

## Run

Use an existing R2 bucket and a dedicated prefix you control. [r2.config.json](r2.config.json)
currently selects bucket `sys-test` and prefix `tmp.sys.driver-cloudflare/r2-proof-ui`. If changing
accounts, also update the matching R2 hostnames in the `push` and `serve` network grants in
[deno.json](deno.json). The `serve` grant also applies to `proof:local`.

Provide the configured credentials in the repository-root `.env` or process environment:

- `SYS_TEST_R2_ACCESS_KEY_ID`
- `SYS_TEST_R2_SECRET_ACCESS_KEY`

Run tasks from `code/sys.driver/driver-cloudflare/-sample/deploy`:

- `build` creates and locally verifies `dist/`, then writes its manifest checksum to
  `dist.pin.json`.
- `push` completely verifies that pinned local build and publishes it without rebuilding or
  repinning.
- `serve` admits the pinned remote manifest before serving on `127.0.0.1:8080`; it does not upload.

For an already-published build, run only `deno task serve`. Valid `dist.pin.json`, `r2.config.json`,
credentials, and the matching remote manifest are required; local `dist/` is optional for serving.

Publishing requires read, list, write, and delete access to the selected target.

**`push` writes to R2 and deletes objects in the configured prefix that are absent from the selected
build.** Do not use a prefix shared with unrelated files.

Publishing is not atomic. A failed push can leave partial changes, with no automatic rollback. Keep
`dist/`, `dist.pin.json`, and `r2.config.json` unchanged during publication.

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

`dist.pin.json` is a `t.DistPin`: one `"dist.json"` key containing the SHA-256 checksum of the exact
manifest bytes. It has no filename inventory and lives outside `dist/`. There is no `artifact.json`
reader or fallback.

Each application instance captures its configuration and pin once, then acquires
`<prefix>/dist.json` through `R2.ReadRoute`: at most one storage GET, 65,536 decoded bytes, and a
five-second deadline, without retries, listing, or redirect following. A signing failure can
initiate zero GETs; a deadline does not establish that transport cleanup has settled.

Canonical `Pkg.Dist.Pinned.admitManifest` checks those bytes against the pin and admits the manifest
within fixed bounds: 256 graph entries, 1 MiB per declared asset, and 4 MiB total declared assets.
The sample then requires `index.html` and sample-safe filenames. Only afterward does it construct
any routes, including the API. Any bootstrap refusal prevents the whole app from starting; there is
no local, unpinned, or partial-start fallback.

Routes are derived from admitted `hash.parts` plus `dist.json`, with `/ui/` mapped to `index.html`.
Their inventory remains fixed for the instance; changes to configuration, pin files, or the remote
manifest do not refresh it.

- `dist.pin.json` → exact manifest-byte checksum used by startup, push, and local verification.
- Local `dist/dist.json` → verified `hash.digest` shown in the startup build detail.
- Served `/ui/dist.json` → `hash.digest` displayed by the browser.

The startup `build` row is a snapshot of the verified local build, not a check of R2. Missing or
mismatched local output is shown as unavailable; it does not prevent serving.

In supporting terminals, `dist/` links to the local directory and the shortened digest links to its
`dist.json`.

Manifest admission is not complete asset verification or proof of provenance. Ordinary asset
responses remain bounded relays: later R2 changes are neither prevented nor verified per response.
Displaying the manifest’s digest does not verify the downloaded assets.

## Verify delivery

`deno task test` runs fixture tests without live R2 requests.

For a read-only check against R2, stop `serve`, then run:

```sh
deno task proof:local
```

Each run captures configuration and `dist.pin.json` once and holds the completely verified local
bytes fixed for comparison. Before remote acquisition, it prints that retained target, pin, selected
files, and operation ceilings. Entry bootstrap, local rechecks, and the final receipt use the same
captured authority; later metadata edits cannot retarget the run.

For N selected files, including `dist.json`, the ceilings are `2 * N + 6` application requests and
`2 * N + 2` storage reads. The storage ceiling includes the initial manifest bootstrap, GET and HEAD
for each selected file, and the `/ui/` index request. Four selected files therefore require up to
ten storage reads. Authority for an earlier pin or a proof without bootstrap does not authorize this
run.

After successful bootstrap, the check starts its own strict listener on `127.0.0.1:8080`, compares
served bytes with the retained expectations, and closes only its own listener. It stops at the first
failure without rebuilding, uploading, or retrying. A refused receipt includes application-request
and bootstrap-attempt counts; a bootstrap attempt is not an observed storage-GET count.

Keep `dist/`, `dist.pin.json`, and `r2.config.json` unchanged during the check. This checks HTTP
delivery, not browser rendering or bucket privacy.

## Access

Application routes require no login. This sample does not configure bucket privacy.
