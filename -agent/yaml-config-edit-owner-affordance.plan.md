# YAML config edit owner affordance: completion record

## Status

Completed and superseded by implemented owner package surfaces.

This file records the final design state before retirement. The durable implementation now lives in:

- `code/sys/yaml/src/m.cli/m.YamlConfig/m.Edit.ts`
- `code/sys/yaml/src/m.cli/m.YamlConfig/t.edit.ts`
- `code/sys/yaml/src/m.cli/m.YamlConfig/-test/-m.Edit.test.ts`
- `code/sys.tools/src/cli.pull/u.add.ts`
- `code/sys/http/src/http.server/m.HttpStatic/*`
- `code/sys/http/src/http.server/m.HttpProxy/*`
- `code/sys/cell/src/m.help/yaml/dsl.*.yaml`

## Completed outcome

The shared owner-config transaction was extracted into `@sys/yaml` and then applied to owner package
config commands.

The core primitive is:

```text
resolve config path
→ load existing YAML or create initial doc
→ apply deterministic owner mutation
→ validate generated config
→ dry-run or write
→ return structured result
```

This kept YAML write mechanics shared while preserving owner-specific semantics.

## Owner boundary preserved

The helper owns:

- resolving `--config` against `cwd`
- checking whether config exists
- choosing `initial()` for missing config
- calling owner `load` for existing config
- calling owner `mutate`
- preserving dry-run no-write behavior
- ensuring parent directory before write
- validating/stringifying generated text through owner callbacks
- returning a small structured result

Owner packages own:

- schema
- initial document
- load/validate behavior
- mutation semantics
- command grammar
- error wording where domain-specific
- result formatting
- `--help` examples

The helper does not know Cell concepts, owner command names, HTTP schemas, pull bundle semantics, or
proxy route semantics.

## Implemented package outcomes

### `@sys/yaml`

Implemented:

```ts
YamlConfig.Edit
```

Primary commit:

```text
6b4df86d0 feat(yaml): add config edit helper
```

### `@sys/tools`

`@sys/tools pull add` now uses the shared YAML edit transaction while preserving the public command
shape:

```sh
deno run -A jsr:@sys/tools pull add --config <pull-config-path> --dist <dist-url> --local <local-target>
```

Primary commit:

```text
e6ac20ab4 refactor(tools): use YAML config edit helper for pull add
```

### `@sys/http/server/static`

Static owner config command exists:

```sh
deno run -A jsr:@sys/http/server/static config add \
  --config <static-config> \
  --dir <dir> \
  --hostname <hostname> \
  --port <port> \
  --dry-run
```

Primary commit:

```text
5cc998aa8 feat(http): add static server config command
```

Cell DSL integration:

```text
be40eecd8 feat(cell): add static HTTP service DSL chapter
```

### `@sys/http/server/proxy`

Proxy owner config commands exist:

```sh
deno run -A jsr:@sys/http/server/proxy config add --config <proxy-config> --hostname <hostname> --port <port>
deno run -A jsr:@sys/http/server/proxy root set --config <proxy-config> --upstream <upstream-url-prefix>
deno run -A jsr:@sys/http/server/proxy mount add --config <proxy-config> --mount <path-prefix> --upstream <upstream-url-prefix>
```

Durable proxy shape:

```yaml
root:
  target: <upstream-url-prefix>
mounts:
  - path: <path-prefix>
    target: <upstream-url-prefix>
```

Route model:

- `/` is not a mount.
- `root set` writes the default route.
- `mount add` writes non-root path-prefix routes.
- mounts win over the default route.

Primary commits:

```text
6d7afec6d feat(http): add proxy config commands
95f6873df feat(http): add proxy root route command
```

Cell DSL integration:

```text
b8fae76cc docs(cell): wire proxy root route DSL
```

## Relationship to `@sys/cell`

This extraction preserved Cell purity.

Cell DSL maps speech acts to owner flows and then records generic runtime topology/config refs:

```text
speech act → missing-slot dialogue → owner config command → Cell runtime service reference
```

Cell does not become the config writer for `@sys/http`, `@sys/tools`, or future services.

Global Cell DSL/help stays abstract and sample-free. Sample-specific slot values belong in sample
fixtures or explicitly labeled README notes, not pure DSL command chapters.

## Completed execution sequence

Completed:

1. Added `YamlConfig.Edit.update(...)` in `@sys/yaml`.
2. Tested the helper in isolation.
3. Refactored `@sys/tools pull add` to use the helper.
4. Ran existing `@sys/tools` pull add tests/checks during the implementation slice.
5. Added `@sys/http/server/static config add` using the helper.
6. Added static config command tests/help tests.
7. Added `@sys/http/server/proxy config add`, `root set`, and `mount add` owner affordances.
8. Added proxy config/root/mount command tests/help tests.
9. Ran `@sys/http` tests/checks during the implementation slice.
10. Wrote `@sys/cell dsl` chapters that point at owner flows instead of hand-authoring owner YAML.

## Final TMIND note

The extraction was correctly timed. There were already three real uses:

1. `@sys/tools pull add`
2. `@sys/http/server/static config add`
3. `@sys/http/server/proxy` config/root/mount commands

The abstraction remained small and callback-driven, avoiding a universal schema or Cell-specific YAML
layer.

## Retirement

This plan is complete. Retire after committing this completion record.
