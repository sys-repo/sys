# Plan: Cell DSL runtime authority hardening

## Status

Closed reference.

This plan remains the final context record for the Cell DSL/runtime-authority
hardening. The implementation has shipped in the product commit below; the plan
artifact is intentionally separate from the product commit.

## Lifecycle cleanup

This file is complete and ready to retire from live working context once the
cleanup commit below is present in history.

```text
plan(archive): close cell DSL runtime authority hardening
```

## Related product commit

- `28cc3d79927f1d7c25ea58c9e45efde30d404c35` — `fix(cell): harden DSL guidance against runtime schema drift`

## Kernel

The Cell DSL is valid only when the runtime that loads, verifies, runs tasks for,
or starts the Cell resolves to the same `@sys/cell` authority that supplied the
DSL guidance.

The protected failure family is runtime/schema drift until proven otherwise:

```text
/dsl: Expected required property
/services: Unexpected property
/dsl: Expected object
```

Agents must not respond by moving `services`, `tasks`, or other descriptor
entries under `dsl`. They must first prove that the operator command resolves the
same Cell runtime/schema as the DSL used for the edit.

## Implemented product reality

- Root DSL guidance now has a `Runtime authority` section and a `Diagnostics`
  section for the `/dsl` + `/services` failure family.
- Durable authority is the effective Deno dependency authority for the final
  operator command: config, import map, lock, and workspace resolution as Deno
  will actually use them.
- `--reload=jsr:@sys/cell` is documented only as a targeted cache/JSR sync step
  when unversioned latest is intended; it is not durable authority and is not the
  final proof command.
- Static serve guidance now requires confirming service slot/config/root plus
  Cell runtime authority before reporting startup commands.
- Static serve guidance keeps `cell.yaml` clean: descriptor refs stay semantic;
  service mechanics stay in owner config.
- Start-services guidance now requires proof with the exact final command the
  human is expected to run. If only a versioned command passes, the agent must
  either establish effective unversioned authority and retest or report the
  versioned command.
- Long-running service proof means startup reaches the expected ready/running
  state; the process does not need to exit.
- Current descriptor shape remains top-level `services[]`; `dsl.services` remains
  invalid.

## Product files changed

- `code/sys/cell/src/m.cell/u.schema/-test/-.test.ts`
- `code/sys/cell/src/m.cli/-test/-dsl.test.ts`
- `code/sys/cell/src/m.help/-bundle/-bundle.json`
- `code/sys/cell/src/m.help/-test/-.test.ts`
- `code/sys/cell/src/m.help/yaml/dsl.service.static-serve.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.start-services.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.yaml`

## Verification record

Verified in `code/sys/cell` before the product commit:

```sh
deno task help:bundle
deno task cli -- dsl
deno task cli -- dsl static-serve-service
deno task cli -- dsl start-services
deno task test --trace-leaks ./src/m.cli/-test/-dsl.test.ts ./src/m.help/-test/-.test.ts
deno task check
```

After the final wording pass and bundle regeneration, verified again:

```sh
deno task help:bundle
deno task test --trace-leaks ./src/m.cli/-test/-dsl.test.ts ./src/m.help/-test/-.test.ts
deno task check
```

## Acceptance result

- Agents cannot follow the DSL without considering Cell runtime authority.
- The known `/dsl` + `/services` failure now points to version alignment before
  descriptor reshaping.
- Static serve guidance preserves clean descriptor refs while making runtime
  resolution deterministic.
- Start guidance distinguishes proven versioned commands from proven unversioned
  operator commands.
- Regression coverage is local and stable; it does not depend on an old JSR
  runtime fixture.

## Explicit non-goals retained

- Do not revert the current descriptor shape for old runtimes.
- Do not put service mechanics in `cell.yaml`.
- Do not require version literals inside every descriptor `from` ref when
  effective Deno dependency authority can pin resolution.
- Do not treat `--reload` as durable authority.
- Do not change `@sys/cell init` output in this pass. Generating `deno.json` by
  default remains a separate product decision.
