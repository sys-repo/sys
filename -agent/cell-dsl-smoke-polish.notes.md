# Cell DSL smoke polish notes

Status: active smoke-test notes.

Purpose: collect observed agent/human friction while running README speech-act prompts against
published/public `@sys/cell` surfaces.

## Note 1: init permission help omits env need

Prompt:

```text
Initialize this folder as a @sys/cell.
```

Observed:

- Agent succeeded.
- Agent used public help first.
- Agent discovered and used:
  - `deno run --allow-env jsr:@sys/cell init --help`
  - `deno run -RW --allow-env jsr:@sys/cell init . --dry-run`
  - `deno run -RW --allow-env jsr:@sys/cell init .`
- Dry-run correctly reported exact planned writes.
- Real init created:
  - `./-config/@sys.cell/cell.yaml`
  - `./.gitignore`
  - `./data/README.md`
  - `./view/README.md`

Friction:

- Help/documented usage suggested `deno run -RW jsr:@sys/cell/cli init [dir]`.
- Plain public CLI/help initially failed without `--allow-env` because a dependency checked env vars
  for color support.
- Adding `--allow-env` made the public CLI work normally.

Polish question:

- Should root/init/help/start examples consistently include `--allow-env` alongside required read/write
  permissions?
- Should root README public examples use `jsr:@sys/cell` or `jsr:@sys/cell/cli` consistently?

Likely target files:

- `code/sys/cell/src/m.help/yaml/root.yaml`
- `code/sys/cell/src/m.help/yaml/init.yaml`
- `code/sys/cell/src/m.help/yaml/start.yaml`
- `code/sys/cell/README.md`

Debug confirmation:

```sh
deno run jsr:@sys/cell --help
```

fails with env permission because chalk/supports-color checks `TF_BUILD`.

Recommended public examples:

```sh
deno run -E   jsr:@sys/cell --help
deno run -ERW jsr:@sys/cell init [dir]
deno run -E   jsr:@sys/cell dsl [chapter...]
deno run -A   jsr:@sys/cell start [dir]
```

Notes:

- `-E` is required for help/DSL because color support probes env.
- `-ERW` is required for init because it needs env plus read/write.
- `-A` already includes env; do not combine `-E` with `-A`.
- Extra spaces for flag-column alignment are shell-safe and improve scanability in docs.
- Published smoke currently showed an older `@sys/cell/cli`-titled help without `start`, so verify the
  target JSR version before judging local docs.

Probe result:

- Published/currently-resolved `jsr:@sys/cell` works with `-E` for help and DSL.
- Published/currently-resolved `jsr:@sys/cell` works with `-ERW` for `init . --dry-run` and `init .`.
- Published/currently-resolved `jsr:@sys/cell` failed on `start` because it resolved an older package
  surface without the start command.
- Local source version proves `start .` on an empty initialized Cell with `-A`, but local file execution
  additionally needs read access for source dynamic imports, so it is not a clean public-permission
  proxy.
- Better local smoke shape: run from a `.tmp/*` folder under repo root using workspace specifier
  `@sys/cell`, not `jsr:@sys/cell`. Because workspace resolution points at local source, help/DSL need
  `-R` in addition to `-E` for dynamic local imports:

  ```sh
  deno run -ER  @sys/cell --help
  deno run -ER  @sys/cell dsl start-runtime
  deno run -ERW @sys/cell init . --dry-run
  deno run -ERW @sys/cell init .
  deno run -A   @sys/cell start .
  ```

- Local `.tmp` workspace smoke passed for help, DSL start-runtime, init dry-run, init, and start on an
  empty initialized Cell.
