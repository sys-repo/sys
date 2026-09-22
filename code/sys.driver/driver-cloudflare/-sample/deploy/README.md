# @sample/r2

### Deno application with public and private R2 delivery

One UI, built once, served from two places:

- **Deno:** the API, `index.html`, and `dist.json`. The files use a
  [bounded private-R2 relay](../../README.md#application-read-routes). Deno fetches them with
  short-lived presigned GET URLs; the browser receives bytes, not signed URLs or R2 credentials.
- **Public R2:** JavaScript, CSS, and referenced assets, loaded directly by the browser. Deno has no
  public-asset relay or backup bundle.

**Planned next:** serve the `sw.js` service worker from the application origin through the private
relay. It is not part of the current build; worker outputs are currently refused.

Application routes require no login. Private storage does not make the page confidential. Scripts
loaded from public R2 have the same page privileges as scripts served by Deno.

## Delivery costs

Public asset bodies bypass Deno; HTML, API, and private-manifest responses still consume its
outbound bandwidth. R2 [does not charge for egress](https://developers.cloudflare.com/r2/pricing/),
but storage and operations remain metered. Deno charges depend on the hosting plan.

Private responses use `Cache-Control: no-store`. The relay's per-response, time, and concurrency
limits are not deployment-wide traffic or spending caps.

## Bucket setup

[r2.config.json](r2.config.json) selects:

```text
Public bucket:   sys-test-public
Private bucket:  sys-test-private
Prefix in both:  tmp.sys.driver-cloudflare/r2-proof-ui/
```

Public bucket URL: <https://pub-72d4e716dcae492f9e174c58866d5533.r2.dev>

The configured `publicAssetBase` appends the public key prefix to that URL. An authenticated S3
endpoint is not a browser asset URL. If changing accounts, also update the matching R2 hostnames in
the `push` and `serve` network grants in [deno.json](deno.json). These grants also cover
`push:public` / `push:private` and `proof:local`, respectively.

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

This permits pages on any origin to read intentionally public assets; it grants no write access.
Keep the private bucket's public URL and custom domains disabled. Deno reads it server-side, so it
needs no CORS policy. The sample neither configures nor verifies bucket exposure.

`r2.dev` is rate-limited development infrastructure. A custom domain is not required for this
sample.

## Credentials

This sample uses **one S3 key pair** for `push:public`, `push:private`, `serve`, and `proof:local`.
Create one R2 token with **Object Read & Write** access scoped to both `sys-test-public` and
`sys-test-private`. Publishing includes listing and deleting objects.

Set its **Access Key ID** and **Secret Access Key** in the repository-root `.env` or process
environment—not the separate API Token value:

```dotenv
SYS_TEST_R2_KEY_ID="..."
SYS_TEST_R2_KEY_SECRET="..."
```

Keep values untracked; never put them in `r2.config.json` or the frontend. Existing credentials are
not assumed to cover these buckets.

Serving and proof perform only private-bucket reads, but the shared credential can write to both
buckets. For stricter deployments, the existing `credentials.serve`, `credentials.pushPrivate`, and
`credentials.pushPublic` mappings in `r2.config.json` can reference different environment-variable
pairs; the libraries do not require sharing. No additional credential pair is needed for this
sample. Publishing passes credential references to `Deploy.push`, which resolves them and owns
publication.

Missing or blank resolved credentials stop the affected task before R2 access. Its output provides
copyable `NAME="..."` assignments for the missing names and explains setup without a stack trace.
Replace `...` with real, non-empty credentials; the output never includes credential values.
Commented `.env` lines are ignored; active entries override exported values, including empty
entries. Fix the values and rerun the task; `build` needs no credentials. This is a setup check, not
verification of R2 access permissions.

Recognized R2 push failures use the same stack-free layout and failure exit as missing credentials.
They report the operation, available HTTP status, and recognized S3 code without raw provider text.
HTTP 401/403 guidance asks you to check the S3 key pair, account, and bucket permissions; it does
not diagnose the exact token mistake. Unexpected errors and runtime permission denials still escape
rather than becoming credential advice.

Failed remote-manifest acquisition—including body reads, content references, enumeration refusals,
and unclassified errors—stops publication rather than becoming a cache miss. Explicit Files/R2
absence permits a first publication. After a successful Files read and any referenced-byte fetch,
Deploy may fall back to a full upload if it cannot decode or validate the metadata. Invalid UTF-8 on
the inline Files path is a read refusal, not this fallback. Later failures can still leave partial
writes; no rollback, retry, or cleanup is implied.

## Build → push → serve

Run tasks from `code/sys.driver/driver-cloudflare/-sample/deploy`.

**Publication writes to each selected R2 prefix and deletes objects there that are absent from its
selected inventory.** `push` affects both prefixes. Use dedicated prefixes you control; do not share
them with unrelated files.

```sh
# One Vite build; verify both projections and write dist.pins.json.
deno task build

# Publish public assets, then the private shell; stop if the public push fails.
deno task push

# Admit the pinned private remote manifest; serve the API and UI locally.
deno task serve
```

`push` runs `push:public && push:private`. Both tasks are also available independently; each
verifies both local projections and publishes only its named target. Neither rebuilds nor repins.
All credentialed tasks use the shared pair above by default.

Keep `dist.private/`, `dist.public/`, `dist.pins.json`, and `r2.config.json` unchanged throughout
publication. Public-first ordering is not atomic: a failure may leave partial changes, without
automatic rollback. If private publication fails, the public changes remain. Pruning can break older
browser sessions; this disposable sample does not promise seamless cached upgrades.

For an already-published candidate, run only `serve`. It requires configuration, selection, the
configured S3 key pair, and the matching private remote manifest—not local build directories or a
public network preflight.

- UI: <http://127.0.0.1:8080/ui/>
- API: <http://127.0.0.1:8080/api/hello>
- Private shell manifest: <http://127.0.0.1:8080/ui/dist.json>

## Build selection

`build` runs Vite once into `dist/`. The sample chooses which files belong in each output:

- `dist.private/`: `index.html` and its own `dist.json`.
- `dist.public/`: frontend assets and their own `dist.json`.

`Pkg.Dist.project` verifies the source, copies the selected files without changing their bytes or
relative paths, and generates and verifies each output manifest. It rechecks the source before
returning the output pins.

### Build record

After projection succeeds, the build writes a sample-owned record to `dist.pins.json`:

- `selection`: a shared `DistPins` value containing `pins.private` and `pins.public` manifest
  checksums.
- `publicAssetBase`: the asset base URL captured for the build.

The file stays outside the output directories. It contains no credentials or file inventory.
`Pkg.Dist.Pins.capture` validates the nested pins and requires both audience names. The sample
checks that the recorded base exactly matches configuration, including for direct startup calls. An
old record format or a changed base requires `deno task build`; loading a record never updates its
pins or infers its base from configuration. Readers use only `dist.pins.json`; neither the former
`dist.selection.json` nor `dist.pin.json` is a fallback. If the new file is missing, rebuild rather
than renaming an old file into place.

Before either push, `Pkg.Dist.Pins.verify` checks both local distributions against their pins.
Status and the HTTP proof check only the private distribution.

### Rebuilding and failures

Build invalidates `dist.pins.json` and the obsolete `dist.selection.json` first, then removes only
`dist/`, `dist.private/`, and `dist.public/`. Any removal failure stops the build. A projection
failure writes no new selection, but completed output directories remain. Rerun `deno task build` to
rebuild them. Staging directories left by a cleanup failure are not removed by a later build.

### Limits and startup

The [verification limits](src/m.app/u.selection.ts) apply to each distribution: a 64 KiB manifest,
256 entries, 1 MiB per payload file, and 4 MiB of payload content. The private/public pair also has
a combined limit of two distributions and 4 MiB of payload content. Payload totals exclude
manifests; these totals do not cap memory use or repeated reads. Worker scripts, extra HTML
documents, and unsupported file types are rejected.

Startup checks the private manifest before creating any route, including the API. If that check
fails, the app does not start. Configuration, selection, and routes stay fixed until restart; after
publication, restart with the matching selection. Public assets must remain available to the
browser; Deno does not serve them as a fallback.

Startup details and the UI digest identify the **private shell**, not the complete bundle. Response
bodies are not rehashed against the manifest, and stored objects may change after startup.

Both UI table rows refer to `/ui/dist.json`, which describes the private HTML:

- `dist.json → hash.digest`: the value stored inside the file, linked to that file for inspection.
  Its last five hex digits match serve's `shell` digest suffix.
- `Checksum of dist.json`: calculated from the whole response file, not stored in a JSON field.
  Compare it with build's selected `private:` pin.

Displaying these values does not verify downloaded files. Compare the same published build;
rebuilding locally does not update R2. The complete Vite build digest and public manifest checksum
describe different inventories, not this shell.

## Verify delivery

`deno task test` uses synthetic credentials and fixture storage, without live R2 requests.

### Private HTTP proof

After publication, `proof:local` performs read-only live R2 requests. Stop `serve`, retain the
matching `dist.private/`, and keep its bytes, configuration, and selection unchanged:

```sh
deno task proof:local
```

The [check](-scripts/u.proof.ts) announces its private target, pin, inventory, and request ceilings
before storage work. It starts and closes its own local server and compares served private bytes and
headers with the verified projection, stopping on failure without upload or retry. Its receipt
covers neither public assets, browser rendering, bucket privacy, nor hosted execution.

Programmatic log callbacks may be synchronous or asynchronous. The proof awaits each report,
including the initial announcement before credential or storage access. Reporting failure stops work
and attempts to close any started server without retrying the logger. Server completion is observed
even if close rejects. A single failure retains its identity; multiple proof, reporting, or cleanup
failures are retained in an `AggregateError`, with the primary failure as its cause. The verified
receipt precedes cleanup and does not itself attest to successful shutdown.

### Browser check

After both pushes succeed, retain the selected candidate and check one cold load:

1. Use an empty browser cache with no controlling service worker. The document stays at the Deno
   origin; API and private-manifest requests go there too.
2. In the network panel, inspect the entry module, preloads, styles, imports, and referenced assets
   actually loaded. Their final URLs must use the configured public base, with working CORS and
   appropriate MIME/content encoding. Correlate them with the build inventory and Deno route policy;
   a cache hit or displayed digest alone is not evidence of the byte path.
3. Block the public entry and reload. The plain HTML explanation should remain visible; React cannot
   render its own failure UI before loading. Request a public asset path under `/ui/` and expect
   refusal, not a relay or signed-URL fallback.

Record this separately from the private HTTP proof. Deno Deploy remains the intended hosting target;
packaged configuration/selection availability and actual hosted browser delivery still require
separate verification before claiming deployed support.
