# Stripe Cell view

This directory is reserved for mutable view files projected by `@sys/tools/pull`.

A manifest URL tells Pull where to fetch a build, not which build to trust. No Pull configuration is
checked in. Before configuring this view, obtain a content pin from the publisher independently of
the download.

Required authority fields only—not a complete Pull configuration:

```yaml
manifest: https://fs.db.team/driver.stripe/dist.json
pin:
  scheme: sys.dist/v2
  digest: sha256-<publisher-provided-content-hash>
```

The pin binds payload paths, checksums, and byte lengths—not the exact manifest document. Do not
reuse a manifest checksum as a content pin or derive the expected pin from the download.

From the Cell root, read `@sys/cell dsl pulled-view`, then use the owner's `@sys/tools pull add`
flow with that pin and confirmed resolved destinations. See
[Pull's setup and path guidance](https://github.com/sys-repo/sys/blob/main/code/sys.tools/README.md#content-pinned-dist-bundles);
do not paste this fragment as a configuration file.
