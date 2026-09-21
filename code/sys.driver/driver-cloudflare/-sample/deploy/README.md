# @sample/r2

### Deno application with R2 assets

This `@sys/driver-cloudflare/r2` sample serves an API and UI from one Deno origin. Deno
[relays UI assets](../../README.md#application-read-routes) from a private R2 bucket; signed URLs
and credentials stay server-side.

Application routes require no login. A private bucket does not make the application private.

## Delivery costs

R2 [does not charge for egress](https://developers.cloudflare.com/r2/pricing/), but this relay
consumes the Deno host's outbound bandwidth; charges depend on its plan. R2 storage and reads remain
metered. Responses use `Cache-Control: no-store`, so normal browser/CDN caching does not absorb
repeat loads.

## Run

Use an existing private R2 bucket and a dedicated prefix you control. Keep public access disabled
for both the bucket's `r2.dev` URL and any custom domains. The sample does not configure or verify
bucket privacy.

[r2.config.json](r2.config.json) currently selects bucket `sys-test` and prefix
`tmp.sys.driver-cloudflare/r2-proof-ui`. If changing accounts, also update the matching R2 hostnames
in the `push` and `serve` network grants in [deno.json](deno.json). The `serve` grant also applies
to `proof:local`.

Provide the configured credentials in the repository-root `.env` or process environment:

- `SYS_TEST_R2_ACCESS_KEY_ID`
- `SYS_TEST_R2_SECRET_ACCESS_KEY`

### Build → push → serve

Run tasks from `code/sys.driver/driver-cloudflare/-sample/deploy`.

**`push` writes to R2 and deletes objects in the configured prefix that are absent from the selected
build.** Do not share that prefix with unrelated files. Publishing requires read, list, write, and
delete access.

A failed push can leave partial changes; there is no automatic rollback. Keep `dist/`,
`dist.pin.json`, and `r2.config.json` unchanged during publication.

```sh
# Build and verify dist/; write dist.pin.json.
deno task build

# Verify and publish the pinned build to R2; no rebuild or repin.
deno task push

# Check the pinned remote manifest; serve the API and UI locally.
deno task serve
```

For an already-published build, run only `deno task serve`; it does not upload. Valid
`dist.pin.json`, `r2.config.json`, credentials, and the matching remote manifest are required; local
`dist/` is optional for serving.

Open the UI at <http://127.0.0.1:8080/ui/>.

- API: <http://127.0.0.1:8080/api/hello>
- Asset manifest: <http://127.0.0.1:8080/ui/dist.json>

## Build selection

`build` verifies `dist/` and writes its manifest checksum to `dist.pin.json`. Startup checks the
remote manifest against that pin before serving any route, including the API. A refusal prevents the
whole app from starting; there is no unpinned fallback.

Configuration, pin, and routes are fixed for each running instance. Restart after publishing a new
build with its matching pin. The [sample limits](src/m.app/u.selection.ts) allow a 64 KiB manifest,
256 graph entries, 1 MiB per asset, and 4 MiB total declared assets.

Startup build details describe local output; the UI digest comes from the served manifest. These
displays do not verify delivered assets or prove provenance. R2 objects may change after startup.

## Verify delivery

`deno task test` runs fixture tests without live R2 requests.

`proof:local` is a read-only check against live R2 and requires the matching local `dist/`. Stop
`serve`, keep `dist/`, `dist.pin.json`, and `r2.config.json` unchanged, then run:

```sh
deno task proof:local
```

The [check](-scripts/u.proof.ts) prints its target, pin, files, and request ceilings before reading
R2, then compares served bytes and headers with the verified local build. It starts and closes its
own local server, stopping on failure without rebuilding, uploading, or retrying. It does not test
browser rendering, hosted deployment, or bucket privacy.

## Two-bucket setup

These targets are selected for direct browser delivery; the sample still uses `sys-test` and relays
all UI assets through Deno.

```text
Public bucket:   sys-test-public
Private bucket:  sys-test-private
Prefix in both:  tmp.sys.driver-cloudflare/r2-proof-ui/
```

Public bucket URL: <https://pub-72d4e716dcae492f9e174c58866d5533.r2.dev>

In the public bucket's **Settings**:

1. Enable **Public Development URL** (`r2.dev`).
2. Open **CORS Policy**, paste the following, and save:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"]
  }
]
```

This policy lets pages on any origin read the public assets; it grants no write access. Store only
public assets in this bucket.

Keep the private bucket's public URL and custom domains disabled. Deno reads it server-side, so it
needs no CORS policy.

`r2.dev` is rate-limited and intended for development. Use a custom domain for production delivery.
