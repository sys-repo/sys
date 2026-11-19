@sys.driver-pi
compile-cache-preload.plan.md
- [x] e1f7cbd22 test(driver-pi): prove scoped compile-cache preloading
- [x] 06de92eea test(driver-pi): prove official Pi preload startup
- [x] c58f4ffde fix(driver-pi): launch Pi 1.4.0 with scoped compile-cache preload
- [x] c89f8f501 fix(driver-pi): follow dependency upgrades without version-gated preloading
- [x] 1c0cb28fa test(driver-pi): retire incidental import-graph assertions

## Closeout: complete, awaiting manual archival

All five implementation commits above are reachable. The first two established synthetic containment
and official CLI startup; `c58f4ffde` combined production integration with dependency adoption.
`c89f8f501` replaced release gating with the bootstrap check and demonstrated the upgrade to Pi
1.5.2. `1c0cb28fa` retired incidental import-graph assertions; the full Driver Pi test chain and
`check` passed afterward. The stdin/RPC work in the historical design was dropped, not delivered.

Phil confirmed: “this has worked - pi is back and working”, reported CI passed, and selected a
release bump followed by manual plan retirement. This is the human acceptance of the terminal-first
unblock, distinct from the automated startup proof. The supplied screenshots show Driver Pi 0.0.149
at profile selection and the launched Pi TUI. CI success is human-reported, not independently
inspected in this closeout.

The [closeout evidence](./compile-cache-preload.plan/proof.md#human-acceptance-and-closeout) records
that acceptance and its limits. Earlier unconfirmed-terminal notes describe their historical
checkpoints, not an outstanding acceptance request. No separate observations establish provider/tool
traffic, normal quit, interruption or terminal restoration; those are evidence limits, not claims
made by this closeout. No universal future Pi/Deno compatibility is implied.

The workspace refresh `b48f6cd76` bumped Driver Pi from 0.0.148 to 0.0.149; this verifies the
repository version, not publication. The later version-row change `bc40f9610` is a separate
presentation feature, not part of this arc or additional runtime proof.

No implementation item or acceptance gate remains open. Preserve this plan and its companion
directory together in `plan(done): compile-cache-preload.plan.md`, then remove both in
`plan(archived): compile-cache-preload.plan.md`. Phil owns both lifecycle commits.

## Landed scope: automatic dependency upgrades

The existing upgrade/prep owners propagate the Pi selection from `deps.yaml` without a release gate.
The official package remains eligible for materialization, but the preload registers a hook only
when the native export is absent and the actual entry matches the closed bootstrap. Phil approved
one native read of `Deno.mainModule` under existing authority. Unmatched entries run natively and
read failures propagate before registration. No new resolver, permission, package or cache mutation
was introduced. Per-launch ownership, cleanup and inherited IO were preserved.

The [upgrade proof](./compile-cache-preload.plan/proof.md#automatic-upgrades-without-a-release-gate)
records the production guard controls and admitted 1.4.0, 1.5.2 and recovery-host runs.

## Landed scope: retire incidental import-graph assertions

The shared scanner mistook `./preload.mjs` inside generated source for a generator dependency.
`1c0cb28fa` retired three structural cases covering the profile entry, task wrapper and preview
worker, plus the unused test export. The shared-checker diagnostic file was untracked and removed;
no shared scanner change, parser, or replacement source scan landed. Existing tests retain lazy GUI
dispatch, isolated preview builds, subprocess outcomes, and launch authority and lifecycle behavior.
See the [retirement proof](./compile-cache-preload.plan/proof.md#import-graph-assertion-retirement).

## Historical design and decisions

This was a proof-first, terminal-first unblock for the official Pi executable on scoped Deno,
not a fork, a new runtime, or the parked zero-Pi kernel effort. The proof started on Deno 2.9.8
(aarch64-apple-darwin), with 0.85.1 still selected and 1.4.0 admitted independently. A process-wide
persistent hook was disqualified: unrelated imports could behave differently while hooks were
active. An injected always-throwing callback established a Deno error-propagation limitation, not
a reachable failure of the narrow candidate. The [synthetic proof](./compile-cache-preload.plan/proof.md#synthetic-containment-item-1)
and [official startup proof](./compile-cache-preload.plan/proof.md#official-startup-item-2) preserve
negative controls, observations and their limits.

The accepted path keeps the official npm bin, argv, cwd and inherited terminal IO. It intercepts
only the main entry's literal `node:module` import during the closed bootstrap, re-exports the real
bindings, supplies only the missing `enableCompileCache` as a no-op returning `{ status: 3 }`, and
synchronously deregisters before the Pi runtime loads. A present native export is not replaced,
even if invalid. No broad loader compatibility or OS confinement is claimed.

Production owns separate checked artifacts per launch. Clean after known pre-spawn failures or
confirmed child settlement; retain and report the directory when settlement is uncertain. Cleanup
failure must not replace the original error or child status. Neither dependency integrity nor
scoped permissions were weakened. The [production proof](./compile-cache-preload.plan/proof.md#authorized-production-correction-and-verification)
records the checked writes, launch ownership, scoped host verification, ZIP checks and evidence
limits. The root and admitted-host dependency graphs are distinct.

The original staged design proposed finite stdin and EOF for `Process.capture`, followed by a
provider-free `get_state` RPC exchange. Those two items were explicitly removed from the unblock;
no process API change, RPC framework, or Driver Pi supervisor was delivered. The official startup
experiment used null stdin and observed shutdown and exit; it did not isolate the shutdown request
from EOF. The revised decision combined later integration and adoption in `c58f4ffde` and used
human terminal acceptance. The later `c89f8f501` change superseded that landing's 1.4.0-only gate.

Removal of the adapter would be a separate change, justified by the same unmodified official CLI
proof on a working release/runtime pair. Future incompatibilities do not authorize wider hooks,
permission expansion, package/cache patches, hidden downgrades, or an alternate entrypoint.

## Reconstruction note

The live plan file was lost before its completion snapshot was committed. This reconstruction
preserves the last inspected opening arc and closeout and summarizes the historical design; it is
not a byte-for-byte copy of the original planning narrative. The companion proof survived and was
not changed during recovery.
