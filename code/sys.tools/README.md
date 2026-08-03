# @sys/tools

CLI surface for @sys primitive compositions.

```bash
deno run -A jsr:@sys/tools
deno run -A jsr:@sys/tools --help
```

## Checksum-pinned Dist bundles

Pull separates artifact identity from mutable local presentation. A Dist bundle requires an exact
publisher-provided checksum for the serialized `dist.json`. That pin authenticates the manifest's
asset checksums and declared sizes; hashing the manifest returned by the same download cannot
establish that authority. The immutable store is keyed by this pin. An optional projection is a
mutable copy and does not inherit verification evidence.

Create the durable Pull configuration through its owner CLI:

```bash
deno run -A jsr:@sys/tools pull add \
  --config ./-config/@sys.tools.pull/components.yaml \
  --manifest https://example.com/ui.components/dist.json \
  --integrity 'sha256-<publisher-provided-manifest-hash>' \
  --store ./.dist-store \
  --project ./view/components \
  --mode replace
```

Configuration and materialization are separate operations. Run the saved configuration when its
files are needed:

```bash
deno run -A jsr:@sys/tools pull --non-interactive \
  --config ./-config/@sys.tools.pull/components.yaml
```

Automatic root upgrade advisory checks can be disabled with:

```bash
deno run -A jsr:@sys/tools --no-upgrade-check
SYS_TOOLS_NO_UPGRADE_CHECK=1 deno run -A jsr:@sys/tools
```
