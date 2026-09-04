# Files transport fidelity hardening

## Status

Active follow-on maintenance.

The durable Files backing/client/service arc is complete. This plan owns only the remaining
cross-package representation and transport-fidelity seams. Do not reopen backing authority,
client-facade ergonomics, hosted service startup, sample polish, or server help work here.

Completed Files history and reusable current truth are indexed in `README.md`.

## Current gaps

- JSON Cmd transports do not faithfully round-trip the `Uint8Array` content used by
  `FilesCmd.Write.BytesPayload`.
- HTTP Cmd is unary while `files:watch` is streaming.
- `Watch.Payload.since` exists, but memory/fs live backings do not currently resume from it.
- Binary write is first-class, but dynamic binary read/ref semantics are not yet first-class across
  memory/fs transports.
- Remote Files errors collapse to string-shaped `CmdError.Remote` failures and lose machine-readable
  Files domain kinds.

## 1 — JSON-safe byte representation

- [ ] Decide whether byte preservation belongs in generic Cmd JSON transport or a Files-specific
      codec.
- [ ] Keep `FilesCmd.Write.BytesPayload.content` as the in-process `Uint8Array` model shape unless a
      model review proves otherwise.
- [ ] Define an explicit, lossless JSON-wire representation.
- [ ] Document the distinction between in-process payloads and JSON-wire payloads.

## 2 — WebSocket byte writes

- [ ] Add a failing Files WebSocket proof showing byte content does not currently arrive as a
      `Uint8Array`.
- [ ] Implement the chosen encode/decode seam.
- [ ] Prove a WebSocket `files:write` mutates real filesystem bytes exactly.
- [ ] Preserve the distinction between command-origin and backing-watch hints.

## 3 — HTTP byte writes

- [ ] Add a focused HTTP Cmd proof over a writable Files backing.
- [ ] Prove lossless byte round-tripping without widening Files authority.
- [ ] Keep the static dist HTTP proof intact.

## 4 — Unary HTTP watch semantics

- [ ] Decide whether generic unary HTTP Cmd rejects streaming commands or Files-over-HTTP exposes a
      transport-adjusted facade.
- [ ] Ensure unary transport capabilities do not imply a usable `watch` operation.
- [ ] Prove explicit rejection, timeout-safe cancellation, or the selected streaming replacement.

## 5 — Watch cursor/resume semantics

- [ ] Decide whether `Watch.Payload.since` is unsupported, best-effort, or backed by a bounded event
      log.
- [ ] If unsupported, reject non-empty cursors consistently in memory and fs live backings.
- [ ] If supported, prove bounded replay and resumed hint delivery.
- [ ] Document that watch events are hints and clients verify truth through `list/stat/read`.

## 6 — Dynamic binary reads

- [ ] Decide whether dynamic backings return binary refs, add a byte-read result, or explicitly
      reject non-text reads.
- [ ] Make binary write followed by read predictable for memory and fs backings.
- [ ] Do not normalize binary decode failures into misleading not-found errors.
- [ ] Cover text, invalid UTF-8/binary, and maximum-read behavior.

## 7 — Structured remote Files errors

- [ ] Extend Cmd remote envelopes or define a compatible structured error payload convention.
- [ ] Preserve safe Files error name/kind/message data.
- [ ] Prove clients can distinguish `PolicyDenied`, `NotFound`, `WriteTooLarge`, and transport-level
      `CmdError.Remote`.

## 8 — Boundary and regression proof

- [ ] Keep `m.files.fs` structural/model-only with no runtime `@sys/fs` import.
- [ ] Keep the `@sys/fs` bridge free of runtime `@sys/model` imports.
- [ ] Keep static, memory, fs, HTTP, server, and event package boundary tests green.
- [ ] Run focused transport-fidelity tests before broader affected-package validation.

## Landed adjacent work

Server DSL/help and speech-act alignment is complete in:

- `4d6f177e8 docs(server): update DSL for hosted Files websocket reality`

It is not part of the remaining transport implementation.

## Non-goals

- No backing-authority redesign.
- No second Files-specific local transport adapter.
- No return to manual Files consumer wiring through raw `Cmd.make(...)`.
- No Files-specific watch lifecycle manager without a fresh API review.
- No write/remove, pagination, or content-prefetch expansion unrelated to transport fidelity.
