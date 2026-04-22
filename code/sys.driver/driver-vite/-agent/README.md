# driver-vite agent archive

This directory is historical campaign material for the Vite 8 bootstrap rewrite and published-boundary closeout.
It is no longer the live source of truth for package behavior.
Its value is:
- reconstruction
- forensic review
- future seam archaeology

The code line is now locally landed enough that this directory should be read as an archive, not as an active work queue.

## What is here
### `./-bootstrap/`
Deep BMIND/TMIND bootstrap passes used to classify the rewrite seam before implementation.

### `./-distillation/`
Execution maps, proof matrices, closeout packets, and debug handoff notes for the rewrite and external published acceptance grind.

### `./CTX.md`
Historical running context from the hardening campaign.
Useful when reconstructing sequence and classification shifts.

### `./INVARIANTS.md`
The durable invariants that survived the campaign and remain the most evergreen part of this archive.

### top-level intent / perspective notes
- `vite8.bootstrap-refactor.intent.md`
- `PLAN.distillation-perspectives.md`
- `vite8.bootstrap-probe.md`

These capture the earlier design posture and distillation framing that led into the implementation line.

## Archive reading order
If later reconstruction is needed, start with:
1. `./INVARIANTS.md`
2. `./README.md`
3. `./-distillation/-PLAN.md`
4. `./-distillation/-PLAN.phases.md`
5. the targeted closeout packet or handoff note relevant to the seam being investigated

## Recovery anchors
- phase.08 closeout
- external published acceptance
- generated-workspace loader bootstrap
- minimal-crutch dev probe
- bootstrap distillation
- vite 8 child bootstrap
