# @sys/tmpl

Command-line templates for system workspaces, packages, and modules, powered by
[`@sys/tmpl-engine`](https://jsr.io/@sys/tmpl-engine).

## Choose and preview a template

Inspect help before applying a template. Agents must read the DSL root, then the matching chapter:

```sh
deno run -RWE jsr:@sys/tmpl --help
deno run -RWE jsr:@sys/tmpl dsl
deno run -RWE jsr:@sys/tmpl dsl repo
```

Preview a new multi-package workspace at an explicit destination without prompting:

```sh
deno run -RWE jsr:@sys/tmpl repo --dir ./my-workspace --non-interactive --dry-run
```

`repo` is a positional template name, not a `jsr:@sys/tmpl/repo` import. Omit `--dry-run` only when
ready to apply the template and its setup steps. Choose a new destination. For an existing target,
`--force` requires explicit overwrite approval; it is not needed for this new-directory preview.

With no template or directory arguments, the CLI is interactive. `--non-interactive` disables
prompts; it does not imply a dry run. `--dryRun` remains a compatibility alias for `--dry-run`. The
leading `-RWE` grants the CLI read, write, and environment access; dry-run is application behavior,
not a restriction on those permissions.

See the [API documentation](https://jsr.io/@sys/tmpl/doc) for the programmatic surface.
