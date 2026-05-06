# Cell DSL speech-act cards: completion record

## Status

Completed and superseded by implemented `@sys/cell dsl` chapters.

This file records the final design state before retirement. The durable guidance now lives in the
public package surfaces:

- `code/sys/cell/README.md`
- `code/sys/cell/src/m.help/yaml/dsl.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.pulled-view.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.static-http-service.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.runtime-service.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.proxy-service.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.start-runtime.yaml`

## Completed outcome

`@sys/cell dsl` is now the agent/human speech-act surface for composing a Cell from public package
affordances.

The root DSL chapter teaches:

- Cell owns topology.
- Owner packages own config schema, validation, mechanics, runtime behavior, and display.
- Owner config internals should not be copied into `cell.yaml`.
- Agents should start from public `--help` surfaces.
- Owner CLIs/APIs should create, validate, and update owner YAML when available.
- Published JSR docs/source are a fallback only for ambiguous module/export contracts.
- Source inspection must not bypass owner config affordances.

The implemented chapter set is:

| Chapter               | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `pulled-view`         | Add a view backed by an `@sys/tools/pull` config.                        |
| `static-http-service` | Add a runtime service backed by `@sys/http/server/static` config.        |
| `runtime-service`     | Add a trusted lifecycle service backed by a service-owned config.        |
| `proxy-service`       | Add a runtime service backed by `@sys/http/server/proxy` config.         |
| `start-runtime`       | Start a composed Cell runtime from a Cell folder.                        |

## Final doctrine

A Cell is a loose composition layer:

```text
Cell       = topology + references
Owners     = config mechanics + runtime behavior
Files      = ordinary medium
Services   = interpretation / serving / operation
```

`@sys/cell` records durable relationships and references. It should not become a mega-config or a
control plane for every owner package.

The reusable composition primitive is:

```text
runtime service = lifecycle endpoint + owner config reference
```

Cell-owned topology shape:

```yaml
runtime:
  services:
    - name: <service-name>
      kind: <kind>
      for:
        views: [<view-name>]
      from: '<module>'
      export: <export>
      config: <config>
```

Cell owns:

- service identity and topology placement
- optional relationship to Cell views
- module specifier and export name for a lifecycle endpoint
- path to the owner config

The owner package owns:

- config schema and validation
- create/update affordances
- mechanics and runtime behavior
- runtime display
- package-specific examples

## Local files and views

Do not add `local-view` as a special first-class DSL act.

Local files are ordinary Cell content. If an agent can edit a file/folder directly, that is ordinary
content editing. If those files need to be served or interpreted, that belongs to a runtime service:

- static HTTP service can serve `./view`, `./data`, or another folder
- proxy service can expose or mount service routes
- custom runtime services can interpret YAML, JSON, Markdown, data folders, or domain state

This keeps Cell loosely coupled. A common shape is an external or pulled UI consuming local `./data`
YAML/JSON/Markdown through a service.

## Implemented speech acts

The public surfaces now cover these durable composition moves:

| Intent                          | Speech-act example                                                       |
| ------------------------------- | ------------------------------------------------------------------------ |
| create: Cell                    | Initialize this folder as an `@sys/cell`.                                |
| create: Cell at path            | Initialize `<path>` as an `@sys/cell`.                                   |
| add: pulled view                | Add a pulled view from `<dist-url>`.                                     |
| refresh: pulled views           | Pull latest configured views.                                            |
| add: static HTTP service (view) | Add a static HTTP service for `<view>`.                                  |
| add: runtime service            | Add a service named `<service-name>` using `<@scope/pkg>/<export>`.      |
| add: proxy service              | Add a proxy service named `<service-name>`.                              |
| route: proxy root               | Route `/` to `<view/service/upstream>`.                                  |
| route: proxy mount              | Route `<path-prefix>` to `<view/service/upstream>`.                      |
| start: runtime                  | Start the Cell runtime.                                                  |

README may show concrete sample slot values only when explicitly labeled:

```text
Sample slot values, not DSL grammar
```

Global DSL/help chapters stay abstract and sample-free.

## Owner affordance rule

For any speech act that creates or updates owner config:

1. Discover the owner package from public `--help`.
2. Use the owner CLI/API/config affordance when available.
3. Use `--config <path>` or the owner equivalent.
4. Prefer dry-run/non-interactive affordances where available.
5. Stop and ask before hand-authoring owner YAML when no owner affordance exists.
6. Register only topology/config references in `cell.yaml`.

Owner package CLI/API minimum contract, when config needs to be created or updated:

- expose discoverable create/update/config affordances from `--help`
- accept `--config <path>` or equivalent
- support dry-run/non-interactive modes where automation would otherwise be unsafe or blocking
- show copyable examples
- fail clearly
- remain Cell-agnostic

## Built-in pull adapter exception

`views.<name>.source.pull` remains a narrow built-in adapter because Cell runtime must resolve a
pulled view source into a local view path.

This does not make Cell the owner of pull mechanics:

- `@sys/tools/pull` owns dist URL, local target, config schema, and materialization.
- Cell stores only the pull config path.

Do not repeat this pattern for static servers, proxies, fixtures, or future runtime services. Those
belong under the generic runtime service primitive.

## Proven owner-backed chapters

### `pulled-view`

- Owner: `@sys/tools pull`.
- Owner config: pull config.
- Cell registration: `views.<name>.source.pull`.
- Materialization is separate from configuration; do not silently pull just because config was added.

### `static-http-service`

- Owner: `@sys/http/server/static`.
- Owner config: static service config.
- Cell registration: generic `runtime.services[]` entry with `from`, `export`, and `config`.

### `runtime-service`

- Owner: any trusted lifecycle module.
- Public contract: `Cell.Runtime.LifecycleEndpoint` with `start(args)`.
- Returned handles may expose `close(reason)`, `dispose(reason)`, and, for long-running waitability,
  `finished`.
- Cell loads service-owned YAML config and calls `start({ cwd: cell.root, ...config, ...derived })`.

### `proxy-service`

- Owner: `@sys/http/server/proxy`.
- Owner config: proxy lifecycle config, root/default route, and non-root mounts.
- Root `/` is not a mount.
- Use `root set` for the default route.
- Use `mount add` for non-root path-prefixes.
- Cell only names the proxy service and config ref.

### `start-runtime`

- Owner/operator primitive: `@sys/cell start [dir]`.
- Start is an operator action, not a config mutation.
- Cell loads the descriptor, starts runtime services, waits, and closes services.
- Services that should keep `@sys/cell start` alive should return a started handle with `finished`.

## Smoke-test loop retained for future acts

For any future Cell DSL speech act:

1. Say the shortest natural prompt.
2. Confirm the agent classifies the intent correctly.
3. Confirm the agent asks for missing slots instead of guessing dangerous values.
4. Confirm the agent uses documented owner surfaces, not hand-authored owner YAML where avoidable.
5. Confirm generated config/topology is valid and reviewable.
6. Promote only minimal durable guidance into `@sys/cell dsl`.

This remains the evergreen loop:

```text
speech act → owner affordance → DSL chapter → smoke test
```

## Non-goals retained

- Do not add sample-specific recipes to global DSL help.
- Do not add a Cell topology mutation CLI for pulled-view composition.
- Do not move pull/static/proxy/runtime mechanics into `@sys/cell`.
- Do not replace owner tool CLIs/APIs with Cell-owned owner config writes.
- Do not turn `cell.yaml` into a mega-config.

## Retirement

This plan is complete. Retire after committing this completion record.
