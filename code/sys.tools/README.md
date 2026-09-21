# @sys/tools

Command-line tools for local development, artifact delivery, and workspace maintenance.

Start with help:

```bash
deno run -A jsr:@sys/tools --help
```

With no command, the CLI opens an interactive menu. Importing the package root exposes only package
metadata; it does not launch the CLI. The command above grants full Deno permissions. Run it only
with code you trust.

## Choose a command

- **Deliver artifacts:** `pull` materializes configured bundles; `serve` serves local files;
  `deploy` publishes to configured destinations.
- **Set up a workspace:** `tmpl` creates from templates and `shell` manages shell integration.
- **Work with documents and media:** `crdt` manages CRDT documents, `video` processes video, and
  `cp` copies text to the clipboard.
- **Run and maintain tools:** `pi` launches the agent harness; `upgrade` updates the local
  `@sys/tools` installation.

Use each command's `--help` for options and `dsl` for operational guidance. See the
[package API](https://jsr.io/@sys/tools/doc) for programmatic entry points.

## Deploy local state

For `build+copy`, every canonical source owns persistent build coordination at
`<source>/-dev/deploy/.sys.rooted/locks/`. Different endpoint workspaces building the same source
share that ownership. Aliases resolve to the canonical source; its namespace parent is not a state
owner. Deploy refuses unavailable write authority, symlinks, and invalid directory identities rather
than falling back to another location.

These lock files survive release so cooperating processes keep using the same inode. Do not put them
in disposable `.tmp` or `dist` directories, or remove/replace the coordination directory during a
build. Build staging copies the source's `dist`, not its development state. Package publication must
also exclude the coordination metadata; this workspace's `.gitignore` contains `.sys.rooted/`.

Staging ownership is separate: its metadata belongs to the caller's cwd. Run operational endpoints
from a dedicated development/deployment workspace, not a library namespace. Copy-only mappings do
not create build-source coordination state.

**Cutover from older Deploy versions:** stop all cooperating builds before switching from the old
source-parent lock namespace to the source-owned one. Old and new versions must not build the same
source concurrently: their locks do not interoperate. Retire only attributed obsolete metadata after
confirmed quiescence and explicit cleanup approval. File age or an empty lock file is not evidence
that deletion is safe. Deploy does not automatically migrate or delete old metadata.

## Checksum-pinned Dist bundles

Pull verifies a Dist bundle against a trusted, publisher-provided checksum of the exact serialized
`dist.json`. That pin authenticates the manifest's asset checksums and declared sizes. Hashing the
downloaded manifest alone cannot establish the publisher's authority.

The store keeps generations by pin. Rooted seals them by clearing filesystem write bits and checking
the resulting mode state. This is point-in-time resistance to modification—not an OS sandbox,
retention lock, hostile-process boundary, ACL guarantee, or sudden-power-loss guarantee.

An optional projection is a mutable copy for local use. It inherits neither the generation's
verification evidence nor its sealing evidence.

Create a saved Pull configuration through the CLI. Replace the example URL and checksum with your
publisher's values:

```bash
deno run -A jsr:@sys/tools pull add \
  --config ./-config/@sys.tools.pull/components.yaml \
  --manifest https://example.com/ui.components/dist.json \
  --integrity 'sha256-<publisher-provided-manifest-hash>' \
  --store ./.dist-store \
  --project ./view/components \
  --mode replace
```

Saving the configuration and making the files available are separate operations. Run the saved
configuration when you need the files:

```bash
deno run -A jsr:@sys/tools pull --non-interactive \
  --config ./-config/@sys.tools.pull/components.yaml
```

To disable the CLI's automatic upgrade advisory checks:

```bash
deno run -A jsr:@sys/tools --no-upgrade-check
SYS_TOOLS_NO_UPGRADE_CHECK=1 deno run -A jsr:@sys/tools
```
