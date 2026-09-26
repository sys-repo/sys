# R2 delivery sample

One UI, built once, served from two places:

- **Application origin:** Deno serves the API, `index.html`, and `dist.json`. The HTML and manifest
  come from the private R2 bucket.
- **Public R2:** the browser loads JavaScript, CSS, and referenced assets directly from the public
  bucket.

R2 credentials and signed URLs stay on the server.

## Setup

### Buckets

Set your account and bucket details in [r2.config.json](r2.config.json).

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

Set `publicAssetBase` to that URL plus the public bucket's prefix.

Keep the private bucket's public URL and custom domains disabled.

If you change accounts, update the R2 hostname in the `push` and `serve` network grants in
[deno.json](deno.json) to match.

### Credentials

Create one R2 token with **Object Read & Write** access to both buckets.

Set its **Access Key ID** and **Secret Access Key** in the repository-root `.env` or process
environment:

```dotenv
SYS_TEST_R2_KEY_ID="<access-key-id>"
SYS_TEST_R2_KEY_SECRET="<secret-access-key>"
```

Keep these values out of source control, frontend code, and `r2.config.json`. Values in `.env`
override exported variables, even when blank.

`serve` uses the same write-capable key. For read-only serving, configure a separate key.

## Build → Push → Serve

**`push` deletes objects within each configured prefix that are absent from the selected build.**
Use dedicated prefixes you control, with no unrelated files. Leave the build output and
configuration unchanged until `push` finishes.

A failed push can leave partial changes; there is no automatic rollback. Removing old assets can
break older browser sessions.

From the repository root:

```sh
cd code/sys.driver/driver-cloudflare/-sample/deploy

deno task build &&
deno task push &&
deno task serve
```

Then open:

- UI: <http://localhost:8080/ui/>
- API: <http://localhost:8080/api/hello>

Restart `serve` after publishing a new build.

The manifest tables show **private relay** and **public R2** separately. Each caption shows that
manifest's distribution digest and payload size, not the size of `dist.json`. The **total bundle**
above both tables is the full Bundle size reported by `deno task build`.

Each table also hashes the exact manifest bytes received. Compare those checksums with the
`private:` and `public:` pins printed by `deno task build`. Compare the private distribution digest
with `deno task serve` → `shell`, and the public digest with `hash.digest` in
`dist.public/dist.json`. These are observed hashes for comparison, not browser-side verification
against trusted pins. Each fetch can fail independently without hiding the other results.

## Same image, two build paths

The footer compares two byte-identical copies of the transparent 200 × 200 wax seal, each displayed
at 64 × 64 CSS pixels. The artwork and revision stay the same; only Vite's build treatment differs.

| Example            | Source                                                         | Public output            |
| ------------------ | -------------------------------------------------------------- | ------------------------ |
| Vite-managed image | [src/ui/images/wax-seal.v1.png](src/ui/images/wax-seal.v1.png) | `pkg/a.[hash].png`       |
| Public file        | [public/images/wax-seal.v1.png](public/images/wax-seal.v1.png) | `images/wax-seal.v1.png` |

Use source-managed assets when Vite should own output naming and references. Use `public/` when
preserving a specific filename is a requirement. Both examples enter `dist.public`; the source
location does not decide which server delivers the image.

The native `<img>` elements live outside React's root. The managed reference is
`./images/wax-seal.v1.png?no-inline`: Vite emits a fingerprinted PNG rather than embedding its bytes
in private HTML. The public reference is `/images/wax-seal.v1.png`: Vite copies the file and
preserves its name. Vite rewrites both references using its resolved `base`, which this sample sets
from `publicAssetBase`. No runtime URL assembly or HTML environment substitution is needed.

Both images load independently of the entry module, directly from public R2, bypassing the
application server with no fallback through it. Captions show the output naming patterns; the shared
"public R2" link opens Cloudflare's public-bucket documentation.

Filenames are not integrity checks.
[Subresource Integrity (SRI)](https://www.w3.org/TR/2016/REC-SRI-20160623/) lets browsers verify
scripts and stylesheets—not these images. The seal artwork is not proof of authenticity.

The duplicated PNG bytes are intentional and checked by a regression test. Keep editable artwork
outside publishable inputs. Do not upload either PNG separately or modify generated output after
inventory capture. Once published, keep `v1` bytes unchanged; use a new revision in both source
locations and HTML references for changed artwork. Versioned or fingerprinted filenames do not
prevent overwrites or set cache headers. Inspect actual response headers when checking delivery.
Neither naming strategy retains old assets: push still prunes objects absent from the selected
inventory.

Direct image delivery avoids application-server egress fees for the PNG bodies; it does not imply
zero storage or operation costs. The `r2.dev` URL is for this demo, not a production-domain setup.

## Clean local outputs

Stop `build`, `push`, and `serve` before cleaning. From this sample directory:

```sh
deno task clean
```

This removes `dist/`, `dist.private/`, `dist.public/`, `dist.pins.json`, legacy
`dist.selection.json`, and `.tmp/`. It leaves source files, configuration, credentials,
`.sys.rooted` lease metadata, and remote R2 objects untouched. Workspace `clean` also invokes this
task.

The build records are removed first. A deletion failure stops the task and may leave partial
cleanup. Fix the cause, then rerun `clean`; missing paths are harmless. Run `deno task build` before
the next `push` or `serve`.

## Check delivery

`deno task test` runs local tests without contacting R2.

### Private responses

Stop `serve` first; this check starts its own server. Use the same local build you published and
leave its files and configuration unchanged:

```sh
deno task proof:local
```

This compares the served HTML and manifest with your local build. It reads from R2 without changing
it.

### Browser delivery

Start `serve` again, then check one cold load:

1. Open the UI with an empty browser cache and no controlling service worker. Confirm it renders.
2. In the network panel, confirm that the document, API, and private manifest load from the
   application origin. The public manifest, JavaScript, CSS, and referenced assets should load
   successfully, with final URLs under the configured `publicAssetBase`. Check both manifest tables
   at desktop and narrow widths: columns should align, links should reach the corresponding
   manifests, and payload sizes should remain distinct from the total bundle.
3. Confirm two separate PNG requests succeed under `publicAssetBase`: the managed `pkg/a.[hash].png`
   and the preserved `images/wax-seal.v1.png`. Both should have `Content-Type: image/png`; record
   their actual cache headers. Neither image may be a data URL or served by the application origin.
4. Check both 64 × 64 images and their labels side by side at a wide viewport and wrapped at a
   narrow viewport. Tab to the shared "public R2" link; confirm visible focus and the documentation
   target.
5. Temporarily block each PNG request independently and reload. The other image, UI, and API should
   still work, with the blocked image's alternative text and caption remaining meaningful. Remove
   each block after checking it.
6. Temporarily block only the public entry module and reload. The HTML notice and both independently
   loaded images should remain visible, but the full UI should not load. Remove the block when
   finished.
7. Temporarily block only the public `dist.json` request and reload. Its table should report a
   public manifest error while the private table, API message, and total bundle remain available.
   Remove the block when finished.

[Private delivery API](../../README.md#application-read-routes) ·
[R2 pricing](https://developers.cloudflare.com/r2/pricing/)
