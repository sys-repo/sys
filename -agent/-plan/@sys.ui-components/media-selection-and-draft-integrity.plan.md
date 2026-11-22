@sys.ui-components
media-selection-and-draft-integrity.plan.md
- [x] e590f8534 fix(ui-components): preserve selected media device across list changes
- [x] 57ac12b48 test(ui-components): distinguish stored device selection from fallback
- [x] b713b83e3 fix(ui-components): preserve recorder filter edits across a debounced update

## Scope

Two Devices changes and a Recorder Debug draft-subscription fix with its mounted regression.
`7f75f600b` is the Devices/Recorder migration baseline; preserve its attachment wiring. Paths below are relative to `code/sys.ui/ui-components/src/ui.react/ui/`.

## Devices results

- `e590f8534`: the baseline returned camera `v1` instead of the chosen mic `a1` at the swap.
  The landed trace follows `v1 → a1 → a1 → a1 → v1` through choice, reorder, refresh and removal.
- `57ac12b48`: fresh mounts restored mic against camera-first ranking, then the accepted replacement
  camera against mic-first ranking. Suppressing writes failed at A (no stored ID/kind); bypassing
  restore failed at B (camera instead of mic). The test passed with and without Strict Mode replay;
  the landed version checks distinct proposals per phase, not callback counts.
- The verified Devices tree passed 3 tests / 18 steps with leak tracing, module type-check, scoped
  lint and `git diff --check`. The second commit was test-only; it also removed four pre-existing
  trailing commas in neighboring examples.

## 1. Preserve the caller's chosen device

Owner: `Media.Devices/use.DeviceSelection.ts` and `Media.Devices/-test/-use.DeviceSelection.test.ts`.
The caller chooses a device; the index is its position in the current list. Without a resolving
seed, a surviving `deviceId` wins over ranking even when its index does not change. Rank only when
there is no surviving choice. The source suggests two ways to break this: read the old slot in the
new list, or fall through to ranking after finding the ID at the same slot.

Refocus the existing reorder/removal examples into one mounted trace. Use labeled devices (`v1`
camera, `a1` mic, `o1` speaker), stable camera-first preferences and no seed. After each React
commit, guard `selected` before reading `toArgs(selected)?.device.deviceId`.

| Action | Required ID | What it distinguishes |
|---|---|---|
| Mount `[camera, mic]`, then `act` → `setSelected(1)` | `v1`, then `a1` | The caller actually selected the non-default mic. |
| Rerender `[mic, camera]` | `a1` | Follow the device, not its old slot. |
| Rerender `[mic, camera, speaker]` with fresh objects and the same IDs | `a1` | A match at the same index wins over the preferred camera. |
| Remove mic: `[speaker, camera]` | `v1` | Rank the remainder; do not keep slot 0. |

Require red on the baseline at the swap and green on the entire trace after the fix. If the swap
already passes, explain why before editing. Keep the public index/setter contract: numeric seeds
are positional; device seeds resolve by ID; a resolving seed wins during external reconciliation,
not on every setter call. Explicit clear on stable inputs forgets the choice. An empty list settles
to no selection; on refill use the applicable seed or default. No storage or specimen changes.

## 2. Prove controlled selection survives a fresh mount

Owner: `Media.Devices/-test/-use.DeviceSelection.Lifecycle.test.ts`. This tests
`useDeviceSelectionLifecycle`, not the index hook in step 1. The pre-fix restore example allowed
video-first fallback to produce the expected result with no saved choice at all.

Follow `Media.Devices/-dev/-ui.StatefulDeviceList.tsx`: both user selection and `onResolve` update
React state; the hook sees the accepted device on the next render. Each fresh mount starts with
`selected === undefined`. Assert the fresh resolve event as well as the resulting controlled choice.

1. **A: write the choice.** Start with empty isolated storage, a never-opened key and both devices.
   Resolve camera, choose mic, and let React commit it. Require `a1/audioinput` in the storage bytes.
2. **B: restore, then replace.** Unmount A. Carry only its emitted bytes into B. With both devices
   present and camera first in `kindOrder`, require mic (fallback alone gives camera). Remove mic
   while B is still mounted. Accept the emitted camera, rerender, and require the bytes to change
   to `v1/videoinput`. This proves persistence of an accepted replacement, not erasure on loss.
3. **C: restore the replacement.** Unmount B. Carry only B's bytes into C, with both devices back
   and mic first in `kindOrder`. Require camera: both a stale mic record and fallback alone give mic.

For each transfer, copy the serialized bytes verbatim into isolated storage under a never-opened
key before mounting. `LocalStorage.immutable` caches refs per key; a fresh component or storage
object alone is not a cold read. Do not call `storageFixture.seed`, synthesize a record, reuse
caller state, or inspect the cached ref as proof of a write. Assert ID/kind, not the whole record.

Keep assertions unchanged for both negative controls. Suppress persistence: A must fail on absent
or stale choice bytes. Restore writing, then bypass restore: A must pass and B must fail because it
resolves camera instead of mic. Undo the control and rerun intact. Keep this commit test-only.
If the intact hook fails a valid trace, report the first failing transition and revisit scope;
do not weaken the test or bundle a production fix.

## 3. Preserve Recorder filter edits across a debounced update

Deliver one permanent, hardware-free regression test in
`Media.Recorder/-test/-spec.filter-draft.test.tsx`. Mount `Debug` from
`Media.Recorder/-spec/-SPEC.Debug.tsx` with the real Filters `List` from `Media.Config/ui.Filters.tsx`.
The list merges each gesture into its last rendered values. At baseline, Recorder wrote the nested
draft immediately but its Debug redraw listened only to top-level signals.

**Observed on `57ac12b48`:** After the brightness gesture, the draft was `(120, 100)` but the labels
still showed `(100, 100)`. Contrast then replaced the draft with `(100, 150)`. Before unmount,
`onChanged` fired once, 252 ms after the last gesture (250 ms debounce); the event, preview filter
and stored filters all lost the brightness edit. The same real list and pointer gestures under a
controlled React parent displayed `120` then `150` and delivered `(120, 150)` once after debounce.

**Approved correction:** In `Debug`’s own `Signal.useRedrawEffect`, track `p.config.filters` as
well as the existing dependencies. Keep the shared `debug.listen()` unchanged: the specimen host
also calls it to redraw the preview. The fix and its mounted regression form one commit. No Slider,
Filters list, Zoom or debounce change is in scope.

**Verification:** With the same regression assertions, the baseline failed at the brightness label
and the fix passed. Labels and draft reached `(120, 150)` before delivery; preview and stored values
changed only after one debounced callback while still mounted. The final regression uses
`WebFixture.Property.mock` to restore its local HappyDOM patches for the missing `status` global
and the detached document listener methods. Their source corrections are outside this plan.
Recorder, Config and Devices passed 6 tests / 40 steps with leak tracing. Module type-check,
exact-file formatting and test lint passed; the Debug file retained its six pre-existing lint
findings. No independent Recorder review is recorded.

Mount with isolated storage, no stream or hardware, settled initial effects, and known nonzero
slider bounds. Use one Filters list and two distinct gestures with normal React commits between
them. Do not force a redraw, subscribe the test host to the draft, or reuse callbacks from an old
render. Control or observe time so both gestures occur inside one debounce window.

1. From brightness/contrast `(100, 100)`, set brightness to `120`. Before the deadline, read the
   rendered brightness label and `p.config.filters.value` separately: both must show the edit.
   The applied preview (`p.filter.value`) and stored filters must still be unchanged.
2. Set contrast to `150`. Require both labels and the draft to represent `(120, 150)`, not
   `(100, 150)`. Keep the list mounted past the debounce interval measured from the last event.
3. Count `onChanged` deliveries directly, not distinct storage writes. Require exactly one for the
   burst, after the last gesture's debounce interval and before unmount. Its aggregate, the applied
   preview and the stored filters must retain both edits.
   Disposal can flush a pending event (`takeUntil` precedes `debounceTime`); a first delivery on
   unmount does not count. Preserve pending-event cleanup separately if that path ever changes.

Verify from `code/sys.ui/ui-components`:

```sh
deno task test --frozen --cached-only --quiet --trace-leaks src/ui.react/ui/Media.Recorder/-test/-spec.filter-draft.test.tsx
deno task check --frozen --cached-only --quiet
```

## Verification and exclusions

Run the owning hook test first. After each Devices item, from `code/sys.ui/ui-components`:

```sh
deno task test --frozen --cached-only --quiet --trace-leaks src/ui.react/ui/Media.Devices/-test
deno task check --frozen --cached-only --quiet
```

Compare exact-file format and lint checks with the pre-edit baseline; do not sweep pre-existing
formatting into either commit. Run `git diff --check` and inspect the scoped delta for leftover
faults or probes. Existing green tests do not substitute for the discriminating observations above.
Capture resource cleanup, export-test pruning and filter serializer ordering are out of scope.
