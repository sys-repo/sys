# Historical packet note: initial dev startup optimization lane

## Status
Historical/superseded planning note.
Do not use this file as the live implementation packet.

## Why retained
This file captured the first post-instrumentation optimization framing before the plan was sharpened further.
It still has historical value as an intermediate distillation step.

## Current authority
There is no live next-step implementation packet in this historical note.
Current state-truth is tracked in:
- `./dev-startup-perf.callsite-cache-truth.md`

Historical packet notes:
- `./dev-startup-perf.resolve-reuse.packet.md`
- `./dev-startup-perf.transport-cache.packet.md`

## What changed
The initial packet mixed several candidate lanes:
- resolution reuse
- `sys:npm-prewarm` narrowing
- Vite-native warmup/deps levers

After harder TMIND/STIER review plus measured local evidence, that was judged too broad for the next implementation move.

The current sharper packet split is:

### Packet A
Resolver reuse correctness with measured payoff.
This packet landed as the session-local resolve reuse layer.

### Packet B
Separate `sys:npm-prewarm` breadth packet.
Not yet opened.

### Packet C
Vite-native warmup/deps tuning only if still warranted after Packet A and Packet B.
Not yet opened.

### Packet D
Persistent transport transform cache under Vite cache ownership.
This packet landed as the dev-only remote immutable transform cache layer.

## Use of this file now
Read this file only as historical context for how the packet ranking evolved.
For current outside-in state truth, follow:
- `./dev-startup-perf.callsite-cache-truth.md`

For implementation, derive the next packet from that current truth rather than reopening this historical note.
