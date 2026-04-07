# Pi integration notes

Summary of the agreed `@sys/driver-agent` Pi structure.

## Intended shape

- `driver-agent/pi`
  - public Pi driver surface
  - exports the Pi runtime surface
  - exports the Pi type plane
  - composes lower layers without coupling to UI

- `driver-agent/pi/core`
  - lowest-level truthful Pi wrapper
  - owns direct Pi ESM/API integration
  - handles transport, lifecycle, event/stream translation, and substrate constraints
  - no UI bleed
  - no app orchestration

- `driver-agent/pi/ui`
  - optional primitive UI adapters/components
  - may provide IO bindings, state presenters, or dev/demo helpers
  - must not become the real logic layer
  - must not push design pressure back into `pi/core`

## Boundary rules

Dependency direction should remain one-way:

- `pi/ui` -> `pi` -> `core`

Avoid:

- `core` depending on `ui`
- UI concerns bleeding into `core`
- hidden orchestration in the driver substrate
- invented capabilities that Pi does not actually expose

## Design intent

This follows canon driver rules:

- drivers are thin
- drivers are truthful
- drivers translate; they do not decide
- lifecycle and side effects are explicit
- UI remains an adapter layer, not the source of truth

## Policy split

Keep `pi/core` as the pure Pi-facing substrate.

Keep `pi` as the logic/policy wrapper around `core`, but only for driver-scoped policy such as:

- option normalization
- session/lifecycle shaping
- stable event mapping
- truthful capability exposure
- error translation

Do not put app/product workflow policy in the driver.
That belongs in the higher-level wrapper/system using this driver.

## UI rule

`pi/ui` is allowed and useful as a primitive adapter layer, provided it remains optional and does not own the real Pi integration semantics.

The real integration semantics should live in `core` and `pi`, not in `pi/ui`.
