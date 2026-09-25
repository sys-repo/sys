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

## Public image

[public/images/wax-seal.v1.png](public/images/wax-seal.v1.png) is the sample's transparent 200 × 200
PNG export, displayed at 64 × 64 CSS pixels. Keep editable artwork outside `public/`. Vite copies
this file into the build, and the build includes it in the public asset inventory. Do not upload it
separately or modify generated output after inventory capture.

The native `<img>` and its caption live in the HTML footer outside React's root. The caption's
"image" link points to the PNG; "public R2" links to Cloudflare's public-bucket documentation. The
image `src` and PNG link both use `%BASE_URL%images/wax-seal.v1.png`. Vite replaces `%BASE_URL%`
with its configured `base`, which this sample sets from `publicAssetBase`. The image loads without
the entry module and has no Deno-hosted fallback. The seal is artwork, not proof of authenticity or
integrity.

Files in `public/` are not automatically fingerprinted. Once published, keep `v1` bytes unchanged;
use a new filename and update both HTML references for a changed export. Versioned filenames do not
prevent overwrites or set cache headers. Inspect the actual response headers when checking delivery.
Revisioned filenames do not retain old assets: the push task still prunes objects absent from the
selected inventory.

Direct image delivery avoids Deno egress for the PNG; it does not imply zero storage or operation
costs. The `r2.dev` URL is for this demo, not a production-domain setup.

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
   application origin. JavaScript, CSS, and referenced assets should load successfully, with final
   URLs under the configured `publicAssetBase`.
3. Confirm a separate request for `images/wax-seal.v1.png` succeeds under `publicAssetBase`, with
   `Content-Type: image/png`. Record its actual cache headers. The caption's "image" link should
   resolve to the same public object; "public R2" should open the public-bucket documentation. No
   PNG request should be served by the application origin.
4. Check the centered 64 × 64 image and readable caption at a narrow viewport. Tab to both caption
   links and confirm their focus remains visible.
5. Temporarily block only the PNG request and reload. The UI and API should still work, with the
   image's descriptive alternative text and caption remaining meaningful. Remove the block.
6. Temporarily block only the public entry module and reload. The HTML notice and independently
   loaded image should remain visible, but the full UI should not load. Remove the block when
   finished.

[Private delivery API](../../README.md#application-read-routes) ·
[R2 pricing](https://developers.cloudflare.com/r2/pricing/)
