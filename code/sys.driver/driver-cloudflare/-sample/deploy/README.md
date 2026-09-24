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
3. Temporarily block the public entry module and reload. The HTML notice should remain visible, but
   the full UI should not load. Remove the block when finished.

[Private delivery API](../../README.md#application-read-routes) ·
[R2 pricing](https://developers.cloudflare.com/r2/pricing/)
