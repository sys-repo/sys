# Historical packet note: initial dev startup optimization lane

## Status
Historical/superseded planning note.
Do not use this file as the live implementation packet.

## Why retained
This file captured the first post-instrumentation optimization framing before the plan was sharpened further.
It still has historical value as an intermediate distillation step.

## Current authority
The live next-step implementation packet is:
- `./dev-startup-perf.resolve-reuse.packet.md`

## What changed
The initial packet mixed several candidate lanes:
- resolution reuse
- `sys:npm-prewarm` narrowing
- Vite-native warmup/deps levers

After harder TMIND/STIER review plus measured local evidence, that was judged too broad for the next implementation move.

The current sharper packet split is:

### Packet A
Resolver reuse correctness with measured payoff:
1. single-flight resolve reuse
2. canonical request/alias normalization
3. optional same-session negative caching only if still justified by measurement
4. remeasure
5. stop

### Packet B
Separate `sys:npm-prewarm` breadth packet.

### Packet C
Vite-native warmup/deps tuning only if still warranted after Packet A and Packet B.

## Use of this file now
Read this file only as historical context for how the packet ranking evolved.
For implementation, follow:
- `./dev-startup-perf.resolve-reuse.packet.md`
