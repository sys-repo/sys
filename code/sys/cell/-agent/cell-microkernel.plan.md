# Cell Microkernel Plan

Status: implemented; keep as design record. Posture: STIER/BMIND/TMIND.

## Essence

`@sys/cell` is a boot/composition microkernel, not a state ontology.

Cell owns:

- the Cell boundary: the folder root
- the Cell descriptor: `./-config/@sys.cell/cell.yaml`
- runtime composition: trusted lifecycle services and their config refs

Cell does not own:

- project state roots
- conceptual handles
- view registries
- service-to-artifact edges
- owner mechanics

`view` remains useful as human/design vocabulary: a view is a perception or projection over Cell
state. It should not become a Cell-owned registry, descriptor field, or API obligation.

## STIER confirmation

This plan is high-ROI because it gives Cell one durable reducer: keep only boot/composition facts
that `@sys/cell` must use itself.

The current v1 descriptor has drifted past that line:

- `views` makes Cell a view registry.
- `runtime.services[].for` makes Cell own service-to-artifact relationships.
- static view startup derivation makes Cell branch on service `kind` and interpret owner state.

The correction is not to invent a better Cell-owned ontology. The correction is to push sub-roots,
handles, indexes, and relationships back into owner configs and owner services.

## Kernel test

A field belongs in `cell.yaml` only when `@sys/cell` itself must use it to perform a Cell-owned
operation.

By that test:

- `kind` and `version` stay.
- `runtime.services[]` stays.
- service `name`, `from`, `export`, and `config` stay.
- `views` does not earn kernel status.
- `runtime.services[].for` does not earn kernel status.
- `dsl.root` / `state.root` does not earn kernel status unless Cell itself performs a real operation
  with it.
- service `kind` is suspect if it is only review metadata or tempts runtime branching. If retained
  during migration, it must be metadata only.

## Descriptor v1 direction

This package is still greenfield; do not introduce a migration-only `version: 2` yet. Make the
microkernel shape the `version: 1` shape.

Minimal Cell-owned boot/composition shape:

```yaml
kind: cell
version: 1

runtime:
  services:
    - name: concepts
      from: '@sys/concepts/runtime'
      export: Concepts
      config: ./-config/@sys.concepts/default.yaml
```

The `concepts` service is illustrative, not a kernel default. Owner config owns what the service
acts on:

```yaml
# ./-config/@sys.concepts/default.yaml
root: ./data
index: ./data/anchors.yaml
```

Cell does not need `state.root` to start this service.

## Rule

If an interpreter needs `./data`, `./public`, `./foo`, or any other Cell-relative path, that
interpreter's owner config names it.

The Cell root is the boundary. Owner configs name sub-roots. Services interpret, serve, rewrite, or
operate.

## Completed moves

1. Simplified the existing `version: 1` descriptor to the microkernel shape.
2. Removed `runtime.services[].for` from schema, docs, tests, and samples.
3. Removed `views` and `dsl.root` from the kernel descriptor path.
4. Removed service `kind` from the kernel descriptor.
5. Removed Cell runtime behavior that branches on service `kind` to interpret owner config.
6. Kept `view` as DSL/human vocabulary only when it compiles to owner operations.
7. Treated conceptual handles as ordinary Cell state interpreted by an owner service, not as Cell
   schema.
8. Renamed started service owner return value to `handle` and typed it through
   `LifecycleEndpoint<Handle>`.
9. Renamed start metric `readyAt` to `resolvedAt`; Cell measures only `start(args)` call and
   resolution, not service health or readiness.

## Commit path

1. `docs(cell): add microkernel design plan`
2. `refactor(cell): simplify descriptor to microkernel v1`
3. `refactor(cell): make runtime start composition-only`
4. `refactor(cell): align DSL help with owner-owned views`
5. `test(cell): update samples for microkernel descriptor`
6. `refactor(cell): type runtime service handles`
7. `docs(cell): close microkernel plan`

## Guardrails

- Do not replace `views` with a generic Cell-owned registry under another name.
- Do not make `@sys/cell` inspect owner config internals to recover convenience behavior.
- Tests should prove `Cell.Runtime.start` is composition-only and kind-agnostic.

## Non-goal

Do not replace `views` with a generic Cell-owned `state`, `anchors`, or `concepts` registry.

That would preserve the same error under a better name.
