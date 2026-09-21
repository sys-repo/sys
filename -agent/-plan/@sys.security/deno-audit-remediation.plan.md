# Deno audit remediation

- [ ] chore(deps): record dependency safety patch lifecycle and owner graph
- [ ] fix(deps): settle stale vulnerable graph residue
- [ ] fix(deps): apply proven reversible dependency safety patches
- [ ] chore(deps): classify local-first Pi replacement/quarantine path
- [ ] chore(security): add a clean audit gate after first clean pass

## Scope and related plans

This plan owns the current concrete `deno audit` response for the `sys` workspace. Keep it
operational and evidence-bearing.

DRY boundaries:

- `@sys.security/audit.plan.md` owns the broader first-party security audit. It should point here
  for dependency advisory automation rather than duplicating this owner matrix.
- `@sys.workspace/jsr-yank-vulnerability-response.plan.md` owns the future incident-grade workspace
  automation model. This plan may feed it, but should not rebuild that platform inline.
- `@sys.workspace/release-hardening.plan.md` owns CI/release posture. Add a clean-audit gate only
  after this plan reaches an actual green audit once.

## BMIND position

This is **amber maintenance-security debt**, not a red incident.

Reasons:

- `deno audit` reports no critical advisories.
- Findings collapse into a small set of owner paths, not 33 unrelated fixes.
- Most findings are transitive graph findings under operator tooling or optional/dev-facing
  substrates, not first-party core library vulnerabilities.
- Pi is currently local-first via `@sys/tools/pi`, not CI/shared-host/remote-service execution.

Escalation condition:

- If Pi or any affected package enters CI, a shared Linux host, a multi-user service, or a remote
  agent surface, reclassify immediately. Local-first single-user use keeps Pi bounded; it does not
  make the vulnerable dependency safe.

## Baseline

Command probes already run from the repository root:

- `deno audit` → exit `1`, 33 advisories: 7 low, 21 moderate, 5 high.
- `deno audit --ignore-unfixable` → still 33 advisories.
- `deno outdated` → `@mariozechner/pi-coding-agent` latest is `0.73.1`, while the advisories mark
  `<=0.73.1` vulnerable.
- `deno info npm:monaco-editor@latest` → latest is still `0.55.1`, still pulling `dompurify@3.2.7`.
- `deno info npm:@automerge/automerge-repo@latest` → latest is still `2.5.6`, still pulling
  `uuid@9.0.1`.
- `deno info npm:@mariozechner/pi-coding-agent@latest` → latest is deprecated in favor of
  `@earendil-works/pi-coding-agent`, still vulnerable, and still pulls `undici@7.27.1` and
  `protobufjs@7.6.2`.
- `deno info jsr:@sys/tools@0.0.448` → reaches old published `@sys/http@0.0.300`, which reaches
  `hono@4.12.24`.

Conclusion: direct latest does **not** clear all findings. The work is owner-path classification
plus proper remediation, not blind upgrade.

## Dependency authority

- `deps.yaml` is canonical for dependency pins and generated dependency policy.
- `@sys/esm/deps` already supports npm-compatible `package.json` `overrides` as direct
  `package.json` policy entries in `deps.yaml`.
- `imports.json` and generated `package.json` are generated surfaces.
- Do not hand-patch generated dependency outputs or `deno.lock`; regenerate them from canonical
  inputs and the Deno task surface.

## Owner matrix

| Advisory family       | Current owner path                                                   | Class                             | Design read                                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pi package advisories | Direct root pin: `npm:@mariozechner/pi-coding-agent@0.73.0`          | Bounded local-first tool risk     | No patched upstream latest. Not a stop-the-line incident while only used via local `@sys/tools/pi`, but not fixable by routine bump. Track replacement/quarantine. |
| `undici@7.27.1`       | Pi → `@mariozechner/pi-ai` / Pi direct graph                         | Pi sub-finding                    | Do not separately override unless a Pi replacement path is chosen and proven.                                                                                      |
| `protobufjs@7.6.2`    | Pi → `@google/genai`                                                 | Pi sub-finding                    | Same cluster as Pi; owner fix is replacement/quarantine, not isolated patching.                                                                                    |
| `dompurify@3.2.7`     | `monaco-editor@0.55.1`                                               | Scoped transitive patch candidate | Direct latest still pulls vulnerable DOMPurify. Use a reversible parent-scoped patch only if Monaco checks pass; otherwise wait visibly.                           |
| `hono@4.12.24`        | Stale published `@sys/tools@0.0.448` → `@sys/http@0.0.300` lock path | Proper stale-graph cleanup        | Root Hono is already safe-range. Refresh/settle the lock graph; this should not need a temporary patch.                                                            |
| `uuid@9.0.1`          | `@automerge/automerge-repo@2.5.6`                                    | Scoped transitive patch candidate | Direct latest still pulls vulnerable UUID. Patch only with compatibility proof; Automerge may naturally rev soon.                                                  |

## Dependency Safety Patch contract

A Dependency Safety Patch is not an ignore and not merely an override. It is a temporary,
source-controlled remediation record with owner path, mechanism, proof, and retirement condition.

```ts
type DependencySafetyPatch = {
  readonly id: string;
  readonly status: 'proposed' | 'active' | 'blocked' | 'retired';
  readonly finding: string;
  readonly ownerPath: string;
  readonly mechanism: PatchMechanism;
  readonly proof: readonly string[];
  readonly retirement: readonly string[];
};

type PatchMechanism =
  | {
    readonly kind: 'direct-bump';
    readonly package: string;
    readonly from: string;
    readonly to: string;
  }
  | {
    readonly kind: 'package-override';
    readonly parent: string;
    readonly child: string;
    readonly to: string;
  }
  | { readonly kind: 'lock-refresh'; readonly package: string }
  | { readonly kind: 'replace'; readonly from: string; readonly to: string }
  | { readonly kind: 'quarantine'; readonly package: string; readonly reason: string };
```

Lifecycle:

```text
detected → classified → applied → proven → monitored → retired
```

Hard rules:

- No `deno audit --ignore` as remediation.
- No broad top-level overrides when a parent-scoped override can express the owner path.
- No generated-file edits for dependency policy.
- Every active override must reduce visible risk and carry a retirement probe.
- `quarantine` is containment, not a fixed state.

## Current patch ledger

### DSP-001 — stale Hono graph residue

- status: `proposed`
- mechanism: `lock-refresh`
- owner path: `@sys/tools@0.0.448` → `@sys/http@0.0.300` → `hono@4.12.24`
- proof:
  - refresh/settle dependency graph through task surfaces;
  - `deno audit` no longer reports `hono <4.12.25`;
  - no hand edits to `deno.lock`.
- retirement:
  - none; once stale graph residue is gone, this patch closes.

### DSP-002 — Monaco DOMPurify

- status: `proposed`
- mechanism: `package-override`
- owner path: `monaco-editor@0.55.1` → `dompurify@3.2.7`
- safe target: prove an available `dompurify` version outside `<=3.4.10` before applying.
- proof:
  - parent-scoped override lives in `deps.yaml` under `package.json` policy;
  - `deno task prep` projects it;
  - `deno audit` DOMPurify findings disappear;
  - Monaco consumers check/test.
- retirement:
  - remove the override from `deps.yaml`;
  - run `deno task prep`, install/settle, `deno audit`, and Monaco checks;
  - if clean, commit override removal; if not, restore and keep the patch active.

### DSP-003 — Automerge UUID

- status: `proposed`
- mechanism: `package-override`
- owner path: `@automerge/automerge-repo@2.5.6` → `uuid@9.0.1`
- safe target: prove an available `uuid` version outside `<11.1.1` before applying.
- proof:
  - compatibility check for Automerge repo UUID API use;
  - Automerge driver/model tests;
  - `deno audit` UUID finding disappears.
- retirement:
  - same removal probe as DSP-002, with Automerge tests.

### DSP-004 — Pi local-first replacement/quarantine

- status: `blocked`
- mechanism: `replace` or `quarantine`, not routine override
- owner path: `@sys/tools/pi` → `@sys/driver-pi` → `@mariozechner/pi-coding-agent`
- current disposition:
  - bounded by local-first single-user usage;
  - no patched upstream latest;
  - upstream package is deprecated in favor of `@earendil-works/pi-coding-agent`.
- proof before changing:
  - inspect replacement package API/runtime compatibility;
  - remove template-time direct type import if a local structural type is enough;
  - `cd code/sys.driver/driver-pi && deno task test`;
  - `cd code/sys.driver/driver-pi && deno task check`.
- escalation:
  - required before any CI/shared-host/remote-service use.

## Remediation order

### Phase 1 — proper no-landmine cleanup

- Refresh/settle stale graph residue first, especially Hono.
- Apply direct safe bumps only when a direct dependency has a safe version and tests pass.
- No temporary override required for this phase.

### Phase 2 — reversible transitive patches

- Treat DOMPurify and UUID as Dependency Safety Patch candidates, not permanent dependency policy.
- Apply only one scoped patch at a time.
- After each patch:
  - `deno task prep`;
  - install/settle lock through the repo task surface;
  - `deno audit`;
  - targeted owner tests.

### Phase 3 — Pi bounded-risk path

- Do not force Pi through a transitive override just to clear audit output.
- Keep local-first usage visible as the risk boundary.
- Decide replacement/quarantine on normal maintenance cadence unless usage expands.

### Phase 4 — full verification and gate

Run from repo root after dependency graph changes settle:

```sh
deno task prep
deno task check
deno task test
deno audit
```

Only after `deno audit` reaches green once, add a root audit task and consider wiring it into CI in
a separate release-hardening commit.

## Go / no-go criteria

Go now when:

- the fix is stale graph cleanup;
- the fix is a safe direct bump;
- the scoped override has a clear parent owner, targeted tests, and retirement probe;
- the change is reversible by deleting a `deps.yaml` policy entry and regenerating.

Hold when:

- no safe upstream exists;
- the only fix is a broad or unproven transitive major override;
- audit cleanliness would come from ignoring advisories;
- the affected surface is local-first only and the replacement would be larger risk than waiting.

## Acceptance criteria

- Each finding family is classified as proper cleanup, active patch, blocked/quarantined, or
  retired.
- Active patches live in `deps.yaml` policy or source changes, never generated files.
- Every active override has a successful proof and an explicit retirement probe.
- `deno audit` reaches `0` without advisory suppression before adding a hard gate.
- If `deno audit` cannot reach `0` because of local-first Pi, the residual risk is named and
  bounded; it is not hidden behind ignore flags.
