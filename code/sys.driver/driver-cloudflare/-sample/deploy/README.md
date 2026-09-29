# R2 delivery sample

One UI build, two delivery paths:

- **Application server:** a thin, Web Standards–based server handles the HTML entry point and `/api`
  at `localhost:8080`.
- **Public R2:** the browser loads JavaScript, CSS, images, and other static assets directly from
  the public bucket, never through the application server.

The HTML entry point and its manifest (`dist.json`) come from private R2 through a bounded relay.
The application server is the trust boundary for private R2 access: R2 credentials and signed URLs
stay on the server.

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

**`build` removes the previous local build records and all three output directories before
building.** If the build fails, the previous selection is no longer available; there is no fallback.

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

Restart `serve` after publishing a new build. Startup admits the private inventory against its
recorded content pin; it does not checksum later HTML or manifest responses. `proof:local` checks
one run against captured local bytes, not continuous delivery integrity.

## Read the content table

The **Content** table lists **public**, then **private**, matching the content pins in
`dist.pins.json`. Each row shows the manifest's reported payload size and content digest, with a
link to the manifest. Open it to compare `hash.scheme` and the full `hash.digest` with the matching
pin. `deno task build` also prints the pins; the private digest appears under `deno task serve` →
`shell`.

A content pin binds exact payload paths, checksums, and byte lengths. Root package labels, build
metadata, and JSON layout do not change it.

**Payload** is the size reported by each manifest, not the size of `dist.json`. **Build size** is
the original build's payload total, before the split into private and public files. The collapsed
**Manifest document checksums** section contains the full SHA-256 checksums of the received manifest
bytes, in the same public-first order. A document checksum is not a content pin: it can change while
the payload remains identical.

The browser does not check the reported digests or sizes against trusted pins, verify payload bytes,
or verify browser execution. Each fetch can fail without hiding the other results.

The sample rejects old-format `dist.pins.json` records with rebuild guidance; it does not convert
them or choose replacement pins. Rebuild only outputs you own, and authorize publication separately.

## Same image, two build paths

The footer compares two byte-identical copies of the transparent 200 × 200 wax seal, each displayed
at 64 × 64 CSS pixels. The artwork and revision stay the same; only Vite's build treatment differs.

| Example            | Source                                                         | Public output            |
| ------------------ | -------------------------------------------------------------- | ------------------------ |
| Vite-managed asset | [src/ui/images/wax-seal.v1.png](src/ui/images/wax-seal.v1.png) | `pkg/a.[hash].png`       |
| Public file        | [public/images/wax-seal.v1.png](public/images/wax-seal.v1.png) | `images/wax-seal.v1.png` |

Use source-managed assets when Vite should name the output and update its references. Use `public/`
when a filename must be preserved. Both examples enter `dist.public`; source location does not
determine which server delivers the image.

The native `<img>` elements live outside React's root. The managed reference is
`./images/wax-seal.v1.png?no-inline`: Vite emits a fingerprinted PNG rather than embedding its bytes
in private HTML. The public reference is `/images/wax-seal.v1.png`: Vite copies the file and
preserves its name. Vite rewrites both references using its resolved `base`, which this sample sets
from `publicAssetBase`. No runtime URL assembly or HTML environment substitution is needed.

Both images load directly from public R2, independently of the entry module. Neither falls back to
the application server. Each caption separates build treatment from delivery: "Vite-managed asset"
and "Public file" describe the build paths; "Public R2 ↗" identifies their shared delivery origin
and links to Cloudflare's public-bucket documentation.

Filenames are not integrity checks.
[Subresource Integrity (SRI)](https://www.w3.org/TR/2016/REC-SRI-20160623/) lets browsers verify
scripts and stylesheets—not these images. The seal artwork is not proof of authenticity.

A regression test checks that the two PNG files remain byte-identical. Keep editable artwork outside
publishable inputs. Do not upload either PNG separately or modify generated output after the build
records its inventory. Once published, keep `v1` bytes unchanged. For changed artwork, use a new
revision in both source locations and HTML references.

Versioned and fingerprinted filenames do not prevent overwrites, set cache headers, or retain old
assets. Inspect the response headers when checking delivery. Push still removes objects absent from
the selected inventory.

Direct delivery avoids application-server egress fees for these images. Storage and operation
charges can still apply. The `r2.dev` URL is for this demo, not a production-domain setup.

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

The check verifies the private distribution against its recorded content pin, then compares served
HTML and manifest bytes with captured local files. The initial manifest checksum must still match at
the final local recheck: replacing the document fails the check even if its content pin is
unchanged. Reports record `pin` and `manifestChecksum` separately. R2 is read, not changed.

### Browser delivery

Start `serve` again, then check one cold load:

1. Open the UI with an empty browser cache and no controlling service worker. Confirm it renders.
2. In the network panel, confirm that the document, API, and private manifest load from the
   application origin. The public manifest, JavaScript, CSS, and referenced assets should load
   successfully, with final URLs under the configured `publicAssetBase`. Check the content table at
   desktop and narrow widths: public precedes private, columns align, and the table scrolls within
   the page when needed. Links should reach the corresponding manifests, and payload sizes should
   remain distinct from the build size. Expand the document checksums and confirm the full values
   remain readable.
3. Confirm two separate PNG requests succeed under `publicAssetBase`: the managed `pkg/a.[hash].png`
   and the preserved `images/wax-seal.v1.png`. Both should have `Content-Type: image/png`; record
   their actual cache headers. Neither image may be a data URL or served by the application origin.
4. Check both 64 × 64 images and their labels side by side at a wide viewport and wrapped at a
   narrow viewport. Tab to each "Public R2 ↗" delivery link; confirm visible focus and the
   documentation target.
5. Temporarily block each PNG request independently and reload. The other image, UI, and API should
   still work, with the blocked image's alternative text and caption remaining meaningful. Remove
   each block after checking it.
6. Temporarily block only the public entry module and reload. The HTML notice and both independently
   loaded images should remain visible, but the full UI should not load. Remove the block when
   finished.
7. Temporarily block only the public `dist.json` request and reload. Its row should report a public
   manifest error while the private row, API message, and build size remain available. Remove the
   block when finished.

[Private delivery API](../../README.md#application-read-routes) ·
[R2 pricing](https://developers.cloudflare.com/r2/pricing/)
