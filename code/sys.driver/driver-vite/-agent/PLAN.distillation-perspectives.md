# PLAN — distillation perspectives for `m.vite/u.bootstrap.ts`

## Scope
- Package: `code/sys.driver/driver-vite`
- Primary frontier: `src/m.vite/u.bootstrap.ts`
- Adjacent files are in scope when a pass requires them.

## Purpose
This plan defines the sequence of BMIND/TMIND review passes to run over the current working Vite 8 bootstrap line.

The goal is **not** to reopen the frontier of “what works.”
That line is already proven.

The goal is to:
- distill the current working shape
- classify rescue structure vs essential structure
- extract the true contract and factoring
- drive toward the minimal correct top-down replacement

This plan is explicitly forward-looking.
We do **not** want to support or carry forward debt for pre-Vite-8 compatibility in this distillation line.
The target shape should be pure, clean, and designed around the proven Vite 8+ reality.

## Pass sequence
1. Mechanism taxonomy
2. Standard vs exceptional seam classification
3. Scar tissue audit
4. Essential contract extraction
5. Authority model audit
6. Determinism and identity pass
7. Cache posture pass
8. Consumer-truthfulness pass
9. Hook-placement / factoring pass
10. Upstream overlap pass
11. Proof-preserving rewrite pass
12. Final-shape architecture pass

---

## 1. Mechanism taxonomy
**Question:**
What mechanisms are actually being used here?

**Aim:**
Name the primitive categories without judgment first.

**Examples:**
- import-map synthesis
- alias projection
- module indirection
- temp file authority injection
- runtime package pinning
- child-process bootstrap shaping
- config/runtime seam bridging
- path/specifier rewriting

**Why this pass exists:**
We need to know what kind of thing each move is before deciding whether it is standard, exceptional, essential, or removable.

---

## 2. Standard vs exceptional seam classification
**Question:**
Which mechanisms are standard/idiomatic integration patterns, and which are exceptional rescue patterns?

**Aim:**
Separate:
- normal driver/integration engineering
from
- emergency toolchain workaround logic

**Examples:**
- workspace export alias generation → likely standard
- random temp import-map fabrication → likely exceptional

**Why this pass exists:**
This identifies what belongs in long-lived architecture and what should be challenged.

---

## 3. Scar tissue audit
**Question:**
What looks like accumulated survival logic rather than principled shape?

**Aim:**
Identify:
- over-merged authority
- random IDs
- duplicated compatibility lists
- special-case seams
- package.json fallback detection
- “just enough to move the blocker forward” constructs

**Why this pass exists:**
This is the explicit “what should be dropped or replaced” pass.

---

## 4. Essential contract extraction
**Question:**
What is the minimum real contract this seam must satisfy?

**Aim:**
Reduce the whole bootstrap layer to:
- inputs
- outputs
- invariants
- reasons it exists

**Example framing:**
The child Vite runtime must see enough authority to resolve the config/runtime graph under Deno.

**Why this pass exists:**
Once the essential contract is known, non-essential rescue structure can be challenged directly.

---

## 5. Authority model audit
**Question:**
What kinds of authority are being mixed here, and should they be?

**Aim:**
Classify authority sources:
- consumer `deno.json`
- workspace root `deno.json`
- import map file
- package.json
- hard-coded bootstrap npm deps
- Vite internal runtime specifiers

Then ask:
- which are primary truth?
- which are derived?
- which are accidental?

**Why this pass exists:**
This is one of the deepest architectural passes because the bootstrap seam is fundamentally an authority-projection seam.

---

## 6. Determinism and identity pass
**Question:**
What in this seam has stable identity, and what is random or run-specific?

**Aim:**
Inspect:
- filenames
- paths
- file URLs
- ordering
- cache keys
- content stability

**Why this pass exists:**
It directly addresses whether the current design is stable enough for repeated runs and optimization reuse.

---

## 7. Cache posture pass
**Question:**
What parts of this design support cache reuse, and what parts destroy it?

**Aim:**
Separate:
- stable reusable artifacts
from
- anti-cache design

**Examples:**
- sorted imports → cache-friendly
- UUID temp files → anti-cache
- merged broad authority blobs → potentially anti-cache

**Why this pass exists:**
This is directly tied to the goal of faster Vite dev/build for published JSR `@sys/*` consumers.

---

## 8. Consumer-truthfulness pass
**Question:**
How closely does the bootstrap runtime reflect the actual consumer’s declared world?

**Aim:**
Detect where bootstrap creates a synthetic environment that diverges from:
- real Deno authority
- real published package consumption
- real Vite consumer boundaries

**Why this pass exists:**
This is the pass that tests whether we are building a truthful integration layer or a fake compatibility universe.

---

## 9. Hook-placement / factoring pass
**Question:**
At what layer should each responsibility actually live?

**Aim:**
Decide whether a given concern belongs in:
- bootstrap
- workspace config projection
- app/plugin resolution
- transport
- wrangle/command layer
- `driver-vite` public API
- upstream/plugin interop seam

**Why this pass exists:**
This is the real rearchitecture pass for deciding proper placement of responsibilities.

---

## 10. Upstream overlap pass
**Question:**
Which parts duplicate or compensate for upstream tools, and which parts are truly owned here?

**Aim:**
Compare against:
- `@deno/vite-plugin`
- Vite native config loader
- Deno loader/workspace resolution
- existing `m.vite.config.workspace`

Ask:
- what are we rightly owning?
- what are we compensating for?
- what are we re-implementing unnecessarily?

**Why this pass exists:**
This prevents both over-ownership and naive deletion.

---

## 11. Proof-preserving rewrite pass
**Question:**
Which parts can be safely simplified without reopening the frontier?

**Aim:**
Rank code into:
- keep as-is for now
- simplify safely
- redesign with tests first
- isolate before touching

**Why this pass exists:**
The current line is proven. The redesign must preserve proof rather than reintroduce frontier panic.

---

## 12. Final-shape architecture pass
**Question:**
If this were designed cleanly from scratch today, what would the module boundaries and data flow be?

**Aim:**
Produce the top-down target:
- stable bootstrap contract
- explicit authority projection
- deterministic artifact identity or no artifact at all
- narrow hooks into Vite
- clean separation from app/plugin resolution

**Why this pass exists:**
This is the convergence pass where all earlier analysis is turned into the actual replacement shape.

---

## Execution and write-out protocol
For each pass in this plan, the result must be written out as its own named note under:

- `-agent/-bootstrap/`

Use this file naming shape:

- `-agent/-bootstrap/<n>.<slug>.md`

Examples:
- `-agent/-bootstrap/01.mechanism-taxonomy.md`
- `-agent/-bootstrap/02.standard-vs-exceptional-seams.md`
- `-agent/-bootstrap/03.scar-tissue-audit.md`

Each written note should:
- name the pass exactly
- stay tightly scoped to the pass dimension
- distill to essence, not stream raw exploration
- preserve only the signal needed for the later top-down replacement

Before finishing each note:
1. do a second TMIND check against the pass question and aim
2. then do a final BMIND review for real/correct engineering assessment only
3. only then finalize the write-out

This protocol is intentionally designed so a future prompt can simply say, for example:

- `1. Mechanism taxonomy`
- `/Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/-agent/PLAN.distillation-perspectives.md`

and the pass can be run, double-checked, and written out in the expected place and shape.

## Sequence reminder
1. Mechanism taxonomy
2. Standard vs exceptional seam classification
3. Scar tissue audit
4. Essential contract extraction
5. Authority model audit
6. Determinism and identity pass
7. Cache posture pass
8. Consumer-truthfulness pass
9. Hook-placement / factoring pass
10. Upstream overlap pass
11. Proof-preserving rewrite pass
12. Final-shape architecture pass
