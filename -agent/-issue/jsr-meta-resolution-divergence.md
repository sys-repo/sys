# JSR metadata resolution divergence

Status: done upstream.

## Current reality

The observed failure was real, but the durable fix landed in JSR rather than Deno.

Primary records:
- Deno issue comment capturing the Deno-side symptom and source seam: https://github.com/denoland/deno/issues/35116#issuecomment-4700114749
- JSR fix: https://github.com/jsr-io/jsr/pull/1453

Context issue:
- https://github.com/denoland/deno/issues/35116
- Title: JSR version exists by direct URL but Deno cannot resolve it due to stale package meta.json

Related issue:
- https://github.com/denoland/deno/issues/35075

Discord cross-references:
- https://discord.com/channels/684898665143206084/1203185670508515399/1515286983247921333
- https://discord.com/channels/1308846349051232306/1308846349747355680/1515498633888399360

## What happened

Deno could fail to resolve a freshly published JSR package version even when the exact version metadata was already visible by direct URL on `jsr.io`.

The captured pattern was:

```text
exact version metadata exists
cache-busted package meta.json has newer data
normal package meta.json is stale at CDN edge
deno --reload fails resolution
```

The Deno comment recorded this as a Deno-visible failure mode because `--reload` still requested the package-level `/meta.json` URL. `--reload` bypassed local cache, but it could still receive stale package metadata from the CDN edge.

## Captured example

Package/version:
- `@sys/registry@0.0.297`

Direct exact-version metadata existed:
- `https://jsr.io/@sys/registry/0.0.297_meta.json` → HTTP 200

Package-level metadata was stale at the CDN edge:

```text
https://jsr.io/@sys/registry/meta.json
cf-cache-status: HIT
age: 78200
etag: "b818af107f7606a362167e593c9a5c56"
content-length: 3305
```

Cache-busted package-level metadata had newer content:

```text
https://jsr.io/@sys/registry/meta.json?...
etag: "c17985b1e1c4d90c5730b4065cfca178"
content-length: 3359
```

Fresh Deno resolution failed at the time:

```sh
DENO_DIR="$(mktemp -d)" deno info --reload jsr:@sys/registry@0.0.297
```

```text
error: Could not find version of '@sys/registry' that matches specified version constraint '0.0.297'
```

Deno version:

```text
deno 2.8.3 (stable, release, aarch64-apple-darwin)
```

## Deno-side seam recorded in the issue comment

The Deno comment called out the source path where the symptom surfaced:

- `cli/jsr.rs`: `req_to_nv()` resolves from package-level metadata and calls `force_refresh_package_info()` after a version-resolution miss.
- `cli/jsr.rs`: `force_refresh_package_info()` refetches `/{package}/meta.json` with `CacheSetting::ReloadAll`.
- `libs/cache_dir/file_fetcher/mod.rs`: `ReloadAll` bypasses local cache, but the remote request still targets the same `/meta.json` URL.

That remains useful diagnostic context, but it was not where the final fix landed.

## Outcome

The root cause was addressed on the JSR side:

- https://github.com/jsr-io/jsr/pull/1453

This note should now be read as a historical incident record: Deno exposed the failure during JSR resolution, but the completed fix belongs to JSR metadata/cache behavior.
