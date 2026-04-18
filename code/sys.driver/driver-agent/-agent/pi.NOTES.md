# Pi integration notes

Current working boundary hypothesis for `@sys/driver-agent/pi`.

This note is intentionally provisional. It records the present design direction,
not a locked architecture. Keep only the partitions earned by the first real Pi
adapter pass.

## Core proposition

- Pi is the programmable agent substrate.
- `sys.canon/-canon` is the engineering constitution.
- Skills are an indexing and routing layer into that constitution.
- The value of `@sys/driver-agent/pi` is not generic agent orchestration.
- The value is driving Pi to author and edit real `@sys` TypeScript modules
  under canon constraints.

## What is actually known

- The public package surface should be `driver-agent/pi`.
- The first-class integration target should be direct Pi ESM or SDK surfaces.
- The driver must remain truthful to Pi's real capability surface.
- The driver must not couple core integration semantics to UI.
- App or product workflow policy does not belong in the driver.

## Preferred integration order

1. SDK or ESM integration first
2. print or JSON / process transport as fallback
3. RPC only if later integration boundaries require it

Reason:
- SDK or ESM is the strongest value lane for typed control.
- print or JSON is a compatibility lane, not the main proposition.
- RPC may become useful later, but it should not define the first boundary by
  default.

## Boundary hypothesis

Start with the minimum believable shape:

- `driver-agent/pi`
  - public typed Pi driver surface
  - exposes the runtime surface
  - exposes the type plane
  - stays free of UI coupling

Only introduce a lower layer if the real Pi integration earns it:

- `driver-agent/pi/core`
  - optional low-level Pi substrate
  - owns direct Pi integration only if that split reduces coupling or clarifies
    truth boundaries
  - may own transport, lifecycle, or event translation if those concerns prove
    structurally distinct

Optional UI helpers may exist only as adapters:

- `driver-agent/pi/ui`
  - optional primitive UI adapters or state presenters
  - must not become the source of truth
  - must not push design pressure back into `pi` or `pi/core`

## Dependency direction

If `core` and `ui` are introduced, dependency direction remains one-way:

- `pi/ui` -> `pi` -> `pi/core`

Avoid:

- `pi/core` depending on `ui`
- UI concerns bleeding into the integration substrate
- hidden orchestration in the driver
- invented capabilities that Pi does not actually expose

## Canon fit

This follows canon driver rules:

- drivers are thin
- drivers are truthful
- drivers translate; they do not decide
- lifecycle and side effects are explicit
- UI remains an adapter layer, not the source of truth
- skills index into canon; they do not become a second constitution

## Policy boundary

Driver-scoped policy is allowed only where it keeps the integration legible and
stable, for example:

- option normalization
- session or lifecycle shaping
- stable event mapping
- truthful capability exposure
- error translation

Do not put app, workflow, or product policy in the driver.

## Codex harness note

Codex desktop may provide extra affordances, such as commentary updates, local
tool execution, review directives, or app-level interaction patterns.

Those client-specific affordances must not define the core `pi` driver
contract.

Per canon, client-specific behavior belongs in optional adapters, wrappers, or
integration layers above the core Pi driver surface.

## S-tier guardrails

Do not claim yet:

- that `pi/core` is definitely required
- that RPC is part of the v1 contract
- that Pi already understands `sys.canon`
- that skills alone are sufficient to guarantee `@sys`-grade output

Safer claim:

- Pi can be configured and driven by `sys.canon/-canon` constraints, with
  skills serving as a routing layer into that doctrine.
