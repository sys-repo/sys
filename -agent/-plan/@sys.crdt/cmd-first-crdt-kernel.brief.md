# Cmd-first CRDT kernel: design-review brief

Historical requirements-only review input. The current constraints and proof-first scope live in
[cmd-first-kernels.plan.md](../@sys.driver-crdt/cmd-first-kernels.plan.md). This brief is retained
as the original review input, not a second governing plan.

## Scope

Derive a first-draft design for a small Cmd-first CRDT integration boundary in
`/Users/phil/code/org.sys/sys`.

This brief records human requirements and unresolved questions, not an approved architecture,
implementation plan, prior review, or proof of feasibility. Existing code is evidence, not a
skeleton that the new design must preserve. The filing directory does not select the eventual
package owner.

## Required outcomes

- Use the existing Cmd system for application interaction. Repository/document ownership should
  normally live in a background worker, while the design permits other placements. Explain precisely
  what the application boundary includes and how upstream peer synchronization relates to it.
- Support Automerge and Automerge Repo first. Evaluate Yjs as a second concrete implementation early
  enough to test the common boundary before APIs harden. Challenge that choice if material evidence
  warrants it; an exhaustive CRDT survey is not required.
- Preserve ordinary immutable-style draft editing and access to useful native operations, including
  collaborative text, annotations, rich text, and stable positions. Small means little new
  machinery, not a lowest-common-denominator feature set.
- Treat `Immutable<T>.change(fn)` and `current` as concrete semantic obligations to analyze, not
  merely familiar method names. The required callback execution location and immediate-visibility
  guarantees have not been settled. A proposal that cannot preserve the existing contract must
  expose the limitation and the necessary human decision rather than silently redefine support.
- Seek architectural consistency with the Files model's use of Cmd and thin client conveniences.
  Determine which consistency is useful without presupposing that filesystem and CRDT semantics
  match.
- Keep native library APIs usable and recognizable. Determine how native operations remain
  accessible under each supported placement without requiring an exhaustive universal facade.
- Extract common behavior only when concrete engine/application needs justify its semantics and
  owner. A very small common core, or no additional common runtime beyond existing primitives, is a
  valid outcome. Evaluate total machinery and consumer burden, not just the number of exported
  methods.
- Prefer supported upstream APIs. Establish actual package versions and distinguish pinned behavior,
  current documentation, experimental APIs, and distribution tags. Do not silently upgrade
  dependencies.

## Decisions still open

1. What is the subject of the shared boundary: document ownership, commands, observation, editing,
   replication, or some smaller combination? Which responsibilities already have a truthful owner?
2. Which promises can a worker-based client make about callbacks, local state, native reads, editor
   bindings, and immediate editing feedback? Which combinations require a replica, another
   placement, a restricted facade, or a changed requirement?
3. What mutation intent crosses Cmd? How are ordinary and specialized operations composed,
   validated, ordered, acknowledged, and related to the state against which they were authored?
4. Which transaction, failure, history, cursor, annotation, and undo semantics are genuinely common?
   Which must remain native or explicitly unsupported by a particular adapter?
5. What does an observation contain? How are initial state, subsequent changes, native metadata,
   version identity, cancellation, reconnects, and disposal related without misleading consumers?
6. What belongs in Cmd, the shared CRDT boundary, each driver, an editor adapter, or application
   code? What are the resulting package dependencies and the relationship to the existing
   `@sys/crdt`?
7. What is the smallest paired Automerge/Yjs experiment that can refute the proposed common
   boundary? What must be decided before draft 1, and what can remain outside its scope?

## Repository evidence entry points

Paths below are relative to `/Users/phil/code/org.sys/sys`. Follow relevant implementations, tests,
exports, dependency declarations, and concrete consumers within these boundaries as needed.

- `deps.yaml`
- `code/sys/types/src/t/t.Immutable.ts`
- `code/sys/types/src/t/t.Immutable.events.ts`
- `code/sys/crdt/deno.json`
- `code/sys/crdt/src/types/t.m.Ref.ts`
- `code/sys/crdt/src/types/t.ns.Crdt.ts`
- `code/sys/event/src/m.cmd/`
- `code/sys.model/model/src/m.files/`
- `code/sys.model/model/src/m.files.fs/m.live/u.watch.ts`
- `code/sys.driver/driver-automerge/deno.json`
- `code/sys.driver/driver-automerge/src/m.Crdt.Ref/`
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/`
- `code/sys.driver/driver-automerge/src/m.Cmd/`
- `code/sys.driver/driver-automerge/src/m.Cmd.commands/`
- `code/sys.driver/driver-automerge/src/m.worker/`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/u.bind.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/`

Use official upstream documentation and versioned source/tests to establish native behavior for both
engines. Source access limits are evidence limits; do not invent missing behavior.

## Review boundary and non-goals

The requested deliverable is an independent design assessment and a proposed draft-1 contract in the
review report. No implementation, source edits, dependency changes, migration, Git mutation, or
remote mutation are authorized by this brief.

Do not consult the authoring conversation, prior reports, or older worker-refactor plans. Do not
treat existing implementation choices or prospective package names as requirements. Follow
applicable canon; security, provenance, and sandbox controls remain binding.

This is not a request to replace upstream CRDT algorithms or synchronization protocols, invent a
universal editor schema, serialize/evaluate arbitrary function source, build a plugin framework, or
complete two production drivers before testing their boundary. Any claim that additional machinery
is unavoidable must identify the concrete requirement and the proof that would establish it.
