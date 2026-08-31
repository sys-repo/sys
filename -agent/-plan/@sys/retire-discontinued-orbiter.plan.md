retire-discontinued-orbiter.plan.md
- [x] 6557a0397 fix(tools): avoid ambient env reads for env-free deploy configs
- [x] bc9cd22eb refactor(cell): make deploy sample provider-neutral
- [x] c2a386849 refactor(tools): remove discontinued Orbiter provider and deploy topology
- [x] 231b08e1a chore(deploy): remove discontinued Orbiter product integrations

## Status

- Phase: complete. All four implementation items landed and closeout evidence is reconciled.
- Human decision: Orbiter is gone. Its live integrations and local residue were removed without
  choosing, inferring, or staging replacement publication targets in this plan.
- Providerlessness and ambient authority are orthogonal. An authority-free local-stage config must
  not inspect dotenv, process-environment, or HOME state; valid `${env:NAME}` and supported `~`/`~/`
  source paths request those capabilities explicitly. This is an ordered prerequisite to the Cell
  sample's restricted-authority proof.
- Sequencing relation: before exact-root Tools staging begins, the fresh replan of
  `../@sys.tools/deploy-verified-dist-preview.plan.md` must prove this plan's providerless-staging
  prerequisite, Cell retirement, and Tools retirement items have landed or name an equivalent
  truthful prerequisite.
- Future Cloudflare R2 deployment is separate product work after this subtraction is complete.
- No remote operation, account action, credential inspection, replacement-origin probe, or
  deployment is authorized by this plan.

## Objective

Remove every live Orbiter integration without conflating retirement with its eventual replacement:

1. make authority-free Deploy staging independent of ambient environment and HOME authority;
2. make the direct Cell deploy sample provider-neutral and local-stage-only;
3. retire the `@sys/tools` provider and nested publication topology; and
4. remove dead product deploy tasks, origins, fixtures, ignored config, and ignore rules.

Historical references under `-tmp/-archive/` remain archival evidence and are not runtime residue.
Provider-negative tests may name rejected `kind: orbiter` input. Active examples, neutral fixtures,
tracked runtime source, and Orbiter-owned ignored state must not preserve operational scar tissue.

After provider retirement, Deploy supports:

- providerless staging;
- the first-class inert `noop` provider; and
- the existing R2 adapter, unchanged by this retirement.

Provider-neutral mapping features remain only when they have independent meaning. Explicit
per-mapping shard-template expansion remains a staging feature; Orbiter provider-level site IDs,
shard publication, and origin routing do not.

## Why this is a separate maintenance plan

The verified-preview plan originally treated Orbiter's nested site roots as a long-lived product
constraint and consequently proposed public DistTree verification and hosting. Discontinuation
removes that premise.

Retirement is separate so that:

- deletion is reviewable independently from verified-serving and future publication changes;
- no compatibility tombstone, temporary target, or R2 placeholder preserves dead behavior;
- the Cell sample remains useful for local staging without pretending publication is configured;
- an authority-free local-stage sample does not inspect ambient dotenv, process-environment, or HOME
  state, while explicit `~/` source paths retain their existing DX;
- one explicit human removal decision replaces speculative product gates; and
- the later root-Dist contract remains exact after its callable Tools consumers are removed.

## Live source inventory

### `@sys/tools` provider and topology

Live Orbiter implementation is distributed across:

- `code/sys.tools/src/cli.deploy/u.providers/provider.orbiter/`;
- provider exports, unions, schemas, probes, and formatting;
- push dispatch and Orbiter target resolution;
- endpoint action, capability, reporting, and remote `checkUpToDate` behavior;
- provider-level shard fallback in staging resolution;
- provider-derived absolute shard-domain index rendering;
- Orbiter-focused Deploy tests and initial YAML guidance; and
- exact Orbiter-named generated staging files and package-cache paths under `code/sys.tools/.tmp/`.

### Direct sample consumer

- `code/sys/cell/-sample/cell.deploy/-config/@sys.tools.deploy/orbiter.yaml`;
- `code/sys/cell/-sample/cell.deploy/-config/@sys.cell/cell.yaml` and its push endpoint;
- Cell sample tasks, CLI defaults, cleanup, actual-sample tests, and synthetic formatter paths; and
- ignored generated `code/sys/cell/-sample/cell.deploy/.tmp/deploy/orbiter/` residue.

The sample's Serve service and provider-neutral local staging remain useful. Its publication push
and Orbiter-owned naming do not.

### Active product integrations selected for removal

- `deploy/@tdb.slc/deno.json` invokes Orbiter with two configuration paths already absent from the
  tracked worktree;
- `deploy/@tdb.slc.fs/deno.json` invokes Orbiter;
- ignored local `deploy/@tdb.slc.fs/orbiter.json` and the root `.gitignore` rule preserve its
  config;
- `deploy/@tdb.data/src/ui/ui.HttpOrigin/u.routes.ts` names a production `*.orbiter.website` CDN
  origin; and
- `deploy/@tdb.slc/src/ui.content/-sample/ui.Videos/-SPEC.Debug.tsx` embeds an Orbiter media row.

The human decision is complete removal without replacement. The production data proxy, localhost
data origins, unrelated video rows, builds, tests, serving, and package behavior remain.

## Required invariants

### Provider surface

1. `DeployTool.Config.Provider.All` no longer contains `Orbiter`.
2. Endpoint schema validation no longer admits `provider.kind: orbiter`.
3. No exported provider module, type, schema, formatter, probe, push adapter, or CLI runner names
   Orbiter.
4. No `deno x npm:orbiter-cli` invocation, token/config path, `/bin/sh` grant, installation hint, or
   environment commentary remains in live `@sys/tools` source.
5. Strict unknown-provider behavior remains fail closed; do not retain a compatibility tombstone
   that appears supported.
6. R2, noop, and providerless endpoint validation and execution retain their current contracts.

### Push topology

7. Push-target resolution no longer has Orbiter base/index/shard target branches or
   `OrbiterPushTargetPlan` statistics.
8. `checkUpToDate` and its remote nested `/dist.json` oracle are removed when no non-Orbiter caller
   remains.
9. Push dispatch, capability, spinner/reporting, endpoint action, and public result types contain no
   Orbiter-only shard, site ID, domain-routing, or skipped-shard branches.
10. R2 still resolves exactly one target at `staging.dir` and publishes root `hash.parts` plus root
    `dist.json` with remote prune.
11. Noop remains inert and does not become a substitute publication implementation.

### Staging and presentation

12. Provider-level `shards.total`, `shards.only`, and `shards.siteIds` are removed.
13. Explicit `mapping.shards` and `<shard>` path-template expansion remain provider-neutral staging
    behavior. Their types and resolver inputs no longer depend on `OrbiterProvider`.
14. Orbiter-only absolute shard-domain links, `-root` index-target conventions, provider base-domain
    staging input, and site-root counts are removed when no independent caller remains.
15. Generated indexes use local relative navigation unless a future provider earns another explicit
    origin contract.
16. Initial endpoint YAML and formatting contain no discontinued provider example or install hint.
17. Generic Deploy source/staging/mapping vocabulary remains intact.

### Providerless authority

18. Providerlessness does not imply authority freedom. An authority-free endpoint document contains
    no valid whole-scalar `${env:NAME}` reference and no supported HOME-relative source path (`~` or
    `~/...`). Malformed env-ref syntax and disallowed tilde placement fail validation before
    acquiring ambient authority; `~user` remains an ordinary unexpanded path.
19. Deploy performs pure syntax inspection before invoking dotenv/process-environment or HOME
    resolution. Plain relative and absolute source paths never cause those lookups.
20. Valid `${env:NAME}` values retain existing upward dotenv and process-environment resolution,
    missing-value errors, and all-or-nothing AST mutation. No ref means no dotenv search or
    process-env access.
21. Preserve `~` and `~/...` for source paths as explicit HOME-dependent syntax. Continue to
    delegate expansion to `Fs.Tilde`; invoke it only for supported forms, never for ordinary paths
    or unsupported `~user` forms.
22. A tilde-bearing source config requests only HOME authority where variable-scoped permission is
    available and fails closed with a clear validation error when HOME access or a value is absent.
    A path value resolved from `${env:NAME}` into `~`/`~/...` requests HOME as a second capability
    and never receives it implicitly from generic env access. Tilde forms in staging destinations
    remain invalid relative-path input and fail without HOME lookup.

### Direct consumer subtraction

23. Before the provider union is narrowed, the Cell deploy sample becomes provider-neutral and
    local-stage-only; it does not acquire R2 configuration.
24. Rename the endpoint config to a provider-neutral stage filename and remove its `provider:`
    block.
25. Remove `DeployPushTask`, `deploy:push`, and obsolete prep aliases. Keep one honest sample task
    that stages locally, plus the existing Serve service.
26. Reconcile Cell package tasks, CLI defaults, cleanup, actual-sample tests, and formatter fixtures
    without changing generic Cell task semantics.
27. Cell-owned proof materializes the actual descriptor, endpoint config, and task adapter in a
    disposable Cell; structurally proves the config has no provider and requests no env/HOME
    authority; and runs `sample:deploy` without push, credentials, environment authority, or network
    access.
28. Remove the exact ignored `.tmp/deploy/orbiter/` subtree when present. Preserve provider-neutral
    `.tmp` output and pulled sample input.

### Product cleanup

29. The human removal decision is authoritative for every named product integration; no gate or
    replacement-target inference remains.
30. Remove complete Orbiter deploy task chains from `@tdb/slc` and the Orbiter deploy task from
    `@tdb/slc-fs`, including aliases and callers, while preserving build/test/serve/info behavior.
31. Remove ignored local `deploy/@tdb.slc.fs/orbiter.json` and its root `.gitignore` comment/rule.
32. Remove only the production Orbiter `cdn` entry from the data origin map; preserve the production
    proxy and localhost origins.
33. Remove only the Orbiter debug-video selector row; preserve the remaining video fixtures.
34. No agent action invokes a deploy command, probes a replacement, or mutates remote state.

### Removal quality

35. Retired source files are removed, not commented out or hidden behind aliases.
36. No dead branches, `never` casts, provider tombstones, stale exports, obsolete fixtures, or
    active Orbiter-branded examples remain.
37. Comments listing current providers name only live providers.
38. Unknown exhaustive-switch branches remain only where they defend runtime input.
39. The generic YAML menu fixture uses neutral labels; strict provider-negative tests may retain
    `kind: orbiter` solely to prove rejection.
40. Orbiter-owned ignored state is removed under the explicit human decision, including exact
    Orbiter-named Cell output, Tools staging files/package cache, and SLC-FS config paths.
41. Other `.tmp`, `dist/`, and pulled/generated data remain non-authoritative and are not folded
    into source commits.
42. Active retirement plans and historical `-tmp/-archive/` content are classified separately from
    runtime integration and remain intact.
43. Root-Dist finalization and Cloudflare R2 deployment remain owned by later plans, not this
    maintenance plan.

## Commit contracts

### `fix(tools): avoid ambient env reads for env-free deploy configs`

Deploy endpoint validation currently resolves dotenv and invokes tilde expansion before it knows
whether a document requests either authority. At the Deploy config boundary, inspect parsed env-ref
and path syntax before invoking the canonical `YamlConfig.Env` or `Fs.Tilde` resolvers. Do not fork
dotenv parsing, env-ref semantics, or HOME expansion.

An authority-free providerless YAML uses ordinary paths and must validate and stage without ancestor
`.env`, process-environment, or HOME access. A valid whole-scalar `${env:NAME}` remains an explicit
dotenv/process-env request. Exact `~` and `~/...` source paths remain explicit HOME requests;
preserve that DX, invoke `Fs.Tilde` only for those forms, and do not reinterpret `~user`.
Tilde-bearing staging destinations remain invalid because staging paths are relative.

Malformed env-ref syntax, disallowed tilde placement, and unavailable explicitly requested authority
fail closed with config-local diagnostics. Treat unsupported `~user` as an ordinary literal path; do
not acquire HOME merely because a path contains a tilde character. Do not acquire authority merely
to reject malformed input. Where Deno supports variable-scoped permission, tilde resolution needs
only `HOME`; do not broaden it to arbitrary environment access. If `${env:NAME}` resolves to
`~`/`~/...`, require HOME separately rather than inheriting it from generic env authority.

Use two causal proof layers. First, owner-level tests must establish that zero-ref/plain-path inputs
do not enter dotenv or HOME resolution, while explicit env refs and tilde source paths retain
positive coverage. Second, run providerless copy staging in a child process with no prompt and no
env, net, run, sys, or FFI authority; the harness may own only the narrow subprocess permission
needed to establish that child boundary. Assert the child permission state and staged output. A
broad test profile or a passing no-env process alone is insufficient evidence that dotenv file
lookup was skipped.

Keep this a local Deploy validation correction: do not alter provider schemas, remove tilde support,
add replacement publication configuration, inspect real credentials, read a real dotenv file for
proof, or contact any origin.

### `refactor(cell): make deploy sample provider-neutral`

Rename the sample endpoint config from its Orbiter filename to a provider-neutral stage filename and
remove the provider block. Keep the existing source, staging, and mapping contract so the sample
still demonstrates local Deploy staging.

Replace `DeployPrepTask` with an honestly named stage endpoint, and remove `DeployPushTask`,
`deploy:push`, and obsolete prep aliases from the descriptor and package tasks. Preserve the Serve
service, the `sample:deploy` local-stage entry point, CLI defaults, generic task semantics, and
formatter depth coverage. Run `sample:deploy` through a dedicated cached, non-interactive permission
profile with inherited environment hidden and env/net/run/sys/FFI denied. Replace synthetic Orbiter
config paths with neutral paths.

Add Cell-owned proof that reads the actual sample descriptor and endpoint config rather than only a
synthetic task plan. Materialize the descriptor, config, and task adapter in a disposable Cell;
create its mapped source; structurally prove the config has no provider and requests neither env nor
HOME authority; and run `Cell.Task.run` for `sample:deploy`. The proof runs under the predecessor's
restricted authority and asserts the stage output and sole `deploy:stage` execution. A stale
descriptor path, provider block, authority-bearing path/ref, invalid mapping, broken endpoint
export, or disconnected composite task must fail this commit's own proof.

Replace the stale `sample:publish` formatter-fixture label with a neutral task name without changing
generic Cell formatter semantics.

Remove the ignored `code/sys/cell/-sample/cell.deploy/.tmp/deploy/orbiter/` subtree when present via
the wrapper-owned removal tool. Do not remove pulled sample input, unrelated generated output, add
an R2 placeholder, or invoke deployment.

### `refactor(tools): remove discontinued Orbiter provider and deploy topology`

Remove the provider contract and every Tools topology consumer as one independently type-correct
subtraction. The provider union, adapter, and topology share compile-time contracts and must not be
split across checkpoints.

Delete the provider-owned implementation under:

- `code/sys.tools/src/cli.deploy/u.providers/provider.orbiter/`.

Remove its exports and cases from:

- provider modules and provider type unions;
- endpoint provider schemas;
- provider probe and formatter dispatch;
- push-provider dispatch;
- initial YAML guidance; and
- provider-specific tests.

Remove the topology outside the provider folder:

- Orbiter push-target resolution and menu-forwarding modules;
- base/index/shard publication target types and statistics;
- nested remote `checkUpToDate` orchestration;
- endpoint-action branches that skip Orbiter targets by remote child-manifest hash;
- Orbiter-only target context, reporting, capability, and failure distinctions;
- provider-level shard fallback in mapping resolution;
- provider-derived `indexBaseDomain` staging input and absolute `N.<domain>` generated links; and
- `-root` handling proven to exist only for the retired index-site convention.

Preserve explicit mapping-level shard expansion by resolving it only from `mapping.shards`. Do not
remove `<shard>` staging support or generic `mode: index` merely because Orbiter was their first
publication consumer.

Remove the unreachable `NoopPushTarget`, noop push-dispatch branch, and provider probe topology
while preserving noop schema, formatting, providerless staging, inert staging behavior, hidden push
capability, and the public `no-push-targets` result. Move durable authority and provider-neutral
staging rules into `code/sys.tools/src/m.help/yaml/dsl.deploy.yaml`, then remove the obsolete
`code/sys.tools/src/cli.deploy/-agent/ctx.md`.

Update strict endpoint-schema tests so `kind: orbiter` is rejected as unsupported input, while R2,
noop, and providerless documents retain positive coverage. Neutralize the unrelated Orbiter label in
`code/sys/yaml/src/m.cli/m.YamlConfig/-test/-u.menu.test.ts` without changing its menu-label
behavior. Simplify shared types only after all callers are removed. Keep R2 target context fields
that remain truthful (`bucket`, `prefix`, and optional read origin/domain); remove `siteId` and
publication shard fields when no live caller remains.

Remove current Orbiter-named generated residue via wrapper-owned removal operations:

- `code/sys.tools/.tmp/staging/slc.cdn.video/shard.60/orbiter.json`;
- `code/sys.tools/.tmp/staging/slc.cdn.video/-root/orbiter.json`;
- `code/sys.tools/.tmp/staging.01/slc/orbiter.json`;
- `code/sys.tools/.tmp/staging.01/slc.cdn/orbiter.json`;
- `code/sys.tools/.tmp/staging.01/slc.cdn.video/orbiter.json`; and
- `code/sys.tools/.tmp/.tmp/pi.cli/deno/npm/registry.npmjs.org/orbiter/`.

Do not remove sibling generated output. Do not invoke Orbiter, inspect credentials or home-owned
state, migrate user YAML, contact a remote service, or preserve an adapter stub or transitional
topology type.

### `chore(deploy): remove discontinued Orbiter product integrations`

Apply the human removal decision as one deletion-only product checkpoint:

- remove `d-ipfs-staging`, `d-ipfs-prod`, `deploy`, `deploy-staging`, and `deploy-prod` from
  `deploy/@tdb.slc/deno.json`;
- remove the Orbiter `deploy` task from `deploy/@tdb.slc.fs/deno.json`;
- remove ignored local `deploy/@tdb.slc.fs/orbiter.json` via the wrapper-owned removal tool, then
  remove the root `.gitignore` Orbiter comment and rule;
- remove the production `cdn` entry from `deploy/@tdb.data/src/ui/ui.HttpOrigin/u.routes.ts` while
  preserving the production proxy and both localhost entries; and
- remove the Orbiter selector row from
  `deploy/@tdb.slc/src/ui.content/-sample/ui.Videos/-SPEC.Debug.tsx` while preserving every other
  video fixture.

Do not add replacement task names, placeholder URLs, compatibility aliases, migration comments, or
R2 configuration. Preserve unrelated build, test, serve, clean, info, route, media, and package
behavior. Run package-owned checks without invoking deployment or contacting any origin.

## Closeout proof

Closeout is verification, not a separate implementation commit. Each implementation item lands its
own causal tests and package checks; do not preserve an otherwise-empty workspace-test item.

Completion proof:

- authority-free providerless staging enters neither dotenv/env-ref nor HOME resolution and runs
  with no env, network, subprocess, system, or FFI authority;
- explicit `${env:NAME}` retains existing resolution/error semantics, and explicit `~`/`~/` source
  paths retain HOME-only expansion plus fail-closed behavior when HOME is unavailable;
- invalid env-ref or disallowed tilde placement fails before ambient authority is acquired, while
  literal `~user` paths never invoke HOME;
- the actual Cell sample stages locally from an authority-free providerless config through
  `sample:deploy` and exposes no push task;
- providerless and noop staging remain valid;
- R2 schema, target resolution, push, skip/write/prune, and endpoint reporting remain green without
  gaining migration-specific behavior;
- `kind: orbiter` fails strict endpoint validation;
- no Tools runtime can invoke `deno x npm:orbiter-cli`;
- explicit mapping-level shard templates still expand and honor `requireAll` without a provider;
- generated index links are local and relative;
- product packages expose no Orbiter deployment task or production origin; and
- the exact ignored Cell, Tools, and SLC-FS Orbiter-owned paths are absent.

A reproducible active-source residue scan covered the named Tools, Cell, YAML fixture, root
`.gitignore`, and product paths, with `siteId` checks scoped to Tools deploy topology. Retained
explicit Orbiter text is limited to provider-negative tests, this completed plan, and historical
archives. No other active tracked source, ignored Orbiter-owned config, or Orbiter-named local
output remains.

## Decision and review adjudication

An independent blind review by `gpt-5.6-sol` at `xhigh` was previously adjudicated against live
source and reachable history. Its topology, inventory, causal-proof, noop-residue, and bounded-scan
findings remain accepted.

The subsequent human decision supersedes the review's replacement-choice gates: remove every named
Orbiter integration now and defer all Cloudflare R2 deployment work. TMIND/DMIND reconciliation
therefore removes the gates, makes the Cell sample provider-neutral instead of R2-backed, combines
the now-uniform product subtraction, cleans active neutral-fixture naming, and authorizes removal of
the exact Orbiter-owned ignored paths.

A later TMIND/STIER/DMIND review of the target-attributed Cell delta found that the current
providerless stage path still loads ambient dotenv before resolving whether a YAML document has env
refs, and that the Cell proof bypasses the actual task adapter. Accepted consequences: the ordered
restricted-authority Deploy prerequisite, actual-task proof, structural provider assertion, and
neutral formatter-fixture cleanup recorded in this plan. No remote, credential, or deployment action
informed that review.

The authority strategy was then reviewed by `gpt-5.6-sol` at `max` under TMIND/STIER/DMIND. The
review rejected removal of `~/` as a DX regression and rejected treating providerlessness as proof
of no authority. It accepted syntax-gated canonical resolution: plain paths are authority-free,
valid env refs and supported tilde source paths explicitly request their narrow capabilities,
malformed input fails before acquisition, and proof separates resolver non-entry from
restricted-process execution.

A final target-attributed TMIND review of the implementation found no unresolved security finding.
It confirmed that the environment-capable owner suite is compatibility evidence rather than the
least-privilege claim; injected resolver non-entry tests and the separately restricted child
establish the two causal boundaries. After Orbiter probe removal, Deploy passed 32 tests / 218 steps
and full Tools passed 117 tests / 641 steps; package checking and dry-run publication also passed.

## Expected reconciliation surface

At minimum inspect:

- `code/sys.tools/src/cli.deploy/u.providers/provider.orbiter/`;
- `code/sys.tools/src/cli.deploy/u.providers/{mod,t,u.probe}.ts`;
- `code/sys.tools/src/cli.deploy/u.endpoints/{u.fs,u.resolve,u.schema,u.yaml}.ts` and their focused
  tests;
- `code/sys/yaml/src/m.core/m.EnvRef.ts`, `code/sys/yaml/src/m.cli/m.YamlConfig/m/m.Env.ts`, and
  their env-ref tests;
- `code/sys/fs/src/m.Fs/m/m.Tilde.ts`, its tests, and `code/sys/fs/src/m.Env/u.load.ts`;
- `code/sys.tools/src/cli.deploy/u.push/`;
- `code/sys.tools/src/cli.deploy/u.menu/`;
- `code/sys.tools/src/cli.deploy/u.endpointAction.ts`;
- `code/sys.tools/src/cli.deploy/u.stage.ts`;
- `code/sys.tools/src/cli.deploy/u.staging/u.resolveMappingsForStaging.ts`;
- `code/sys.tools/src/cli.deploy/u.staging/u.generateHtml.ts`;
- `code/sys.tools/src/cli.deploy/u.fmt/`;
- `code/sys.tools/src/cli.deploy/t.namespace.ts` and shared push types;
- `code/sys.tools/src/m.help/yaml/dsl.deploy.yaml`, its generated bundle and focused test, the
  obsolete `code/sys.tools/src/cli.deploy/-agent/ctx.md`, and the exact named `code/sys.tools/.tmp/`
  residue;
- `code/sys/cell/-sample/cell.deploy/`;
- `code/sys/cell/deno.json` and `code/sys/cell/-scripts/{task.cli,task.clean}.ts`;
- actual-sample and formatter tests under `code/sys/cell/src/`;
- `code/sys/yaml/src/m.cli/m.YamlConfig/-test/-u.menu.test.ts`;
- root `.gitignore`;
- `deploy/@tdb.slc/deno.json`;
- `deploy/@tdb.slc.fs/deno.json` and ignored local `deploy/@tdb.slc.fs/orbiter.json`;
- `deploy/@tdb.data/src/ui/ui.HttpOrigin/u.routes.ts`; and
- `deploy/@tdb.slc/src/ui.content/-sample/ui.Videos/-SPEC.Debug.tsx`.

This inventory authorizes only the exact Orbiter-owned ignored paths named by the human decision. It
is not permission to alter archives, unrelated generated caches, pulled sample input, replacement
publication work, or provider-neutral shard helpers.

## Verification

Before the Cell refactor, use the package-owned `test:deploy:authority` task for the complete causal
authority proof. It runs the exact env/path/stage owner tests without network or subprocess
authority, then a cached, non-interactive parent harness that may launch only the Deno child. The
ordinary-path child stages providerless input while asserting denied generic env, net, run, sys, and
FFI authority; explicit-authority child modes grant only the named env variable under test. Owner
tests prove through injected resolvers that plain paths and zero-ref ASTs never enter HOME or dotenv
resolution. Their profile deliberately retains environment authority for positive env/HOME
compatibility cases and is not the least-privilege proof; the restricted child is that capstone.
Neither a broad test profile nor a passing denied-env process alone proves both boundaries.

Also prove explicit-authority behavior separately: existing `${env:NAME}` resolution and
missing-value errors remain stable; `~`/`~/` source paths expand with HOME-only authority; absent
HOME fails closed; `~user` remains unexpanded; env-resolved tilde paths require separately granted
HOME; and tilde staging destinations fail as relative-path violations without a HOME lookup. Before
Orbiter removal, run `deno task test:deploy:authority`, `deno task check`, and `deno task dry` from
`code/sys.tools`. The authority task owns the exact config/path/stage test list plus its restricted
child; do not run broad Tools or Deploy suites whose active provider probe invokes Orbiter. Run
owner-package focused tests, checks, and dry-run publication if a canonical YAML or FS helper
changes.

From `code/sys/cell` after the provider-neutral sample change:

```sh
deno task test:deploy:authority
deno test -P=test --no-prompt --trace-leaks ./src/m.cell/-test/-u.load.test.ts ./src/m.cell/-test/-u.services.verify.test.ts ./src/m.cli/-test/-info.test.ts ./src/m.cli/-test/-task.test.ts ./src/m.cli/-test/-tasks.test.ts
deno task sample:deploy
deno task check
deno task test
deno task dry
```

The owner and restricted-authority runners share one Cell-owned proof that reads the actual sample
descriptor and providerless config, structurally proves it contains neither env refs nor
HOME-relative paths, materializes the descriptor, config, and task adapter in a disposable Cell, and
runs `sample:deploy` through `Cell.Task.run`. The direct authority task grants only read/write,
hides the inherited environment, explicitly denies env/net/run/sys/FFI, launches no child process,
and asserts the sole `deploy:stage` execution plus staged output. The package `sample:deploy`
command uses the same fail-closed authority boundary. The preceding Tools proof must establish
authority-free providerless Deploy staging before this Cell proof runs. Keep ignored `.tmp` and
pulled-view roots excluded from package checking rather than editing or publishing generated bytes.

From `code/sys.tools` after provider retirement:

```sh
deno task test:deploy
deno task check
deno task test
deno task dry
```

The Tools suite did not invoke the removed Orbiter probe. The focused YAML menu test and package
checks passed after its label fixture was neutralized. For the product cleanup item, each changed
package's declared tests and checks, plus dry-run publication, passed without invoking deployment or
contacting origins.

Closeout also confirmed:

- the bounded active-source universe was scanned separately from retirement plans and archives;
- the authorized ignored Cell, Tools, and SLC-FS Orbiter-owned paths are absent;
- provider unions, endpoint schemas, push dispatch, target resolution, initial YAML, noop behavior,
  and the Deploy mental model match the completed implementation;
- mapping-level shard staging works without any provider;
- the final diff preserved R2/noop/providerless behavior, the production proxy, localhost origins,
  and unrelated video fixtures;
- wrapper-owned move/remove operations were used for authorized path changes during implementation;
  and
- only commands actually run and their exact outcomes were recorded.

## Non-goals

- no remote Orbiter deletion or account action;
- no replacement endpoint, bucket, domain, credential, task alias, or placeholder;
- no Cell or product migration to Cloudflare R2;
- no migration of arbitrary user-owned endpoint YAML;
- no R2 redesign;
- no removal of `~`/`~/` source-path support or forced conversion to relative paths;
- no addition of `~user` expansion;
- no broadening of environment authority to preserve tilde DX;
- no removal of provider-neutral mapping shard expansion;
- no root-Dist finalization or verified-preview implementation;
- no public DistTree API;
- no deletion of archival evidence;
- no deletion of generated state beyond the exact Orbiter-owned paths enumerated here.
