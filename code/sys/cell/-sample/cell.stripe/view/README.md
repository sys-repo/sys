# Stripe Cell view

This folder is reserved for mutable view projections created by `@sys/tools/pull`.

No Pull config is checked in because the remote manifest URL is not sufficient authority. Configure
the view only after its publisher supplies the independent SHA-256 of the exact `dist.json` bytes:

```text
manifest:  https://fs.db.team/driver.stripe/dist.json
integrity: sha256-<publisher-provided-manifest-byte-hash>
```
