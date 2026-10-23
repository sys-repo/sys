# Runtime Portability Audit

Dated research evidence, not an adopted migration plan or implementation authorization. Recommendations
remain provisional; preservation here does not establish runtime compatibility or select future work.
Source paths and command working directories below are repository-relative unless stated otherwise.

## 1. Executive assessment

**Assessment date: 2026-10-12 UTC. Starting and closing revision:
`97a7d797939fe129b104e7da904631d58a077ebf`.**

The ecosystem has substantial portable foundations and useful adapter boundaries. It is **not a
uniformly Workers-compatible library collection**. The right unit of analysis is a public
entrypoint, its evaluated import graph, its public types, and the operations actually invoked—not a
package name, a successful metadata-root import, an npm dependency, or a browser compatibility
badge.

Main conclusions:

1. **Validate existing portable leaves before creating abstractions.** Hashing, abstract types,
   immutable state, event commands, text transformations, parsing, schema validation, and playback
   state are credible candidates. Most need evidence rather than a runtime rewrite.
2. **Shared runtime barrels are the highest-leverage coupling mechanism.** An otherwise narrow
   helper can evaluate host dependencies through `common.ts` → `common/libs.ts`. A concrete example
   is `@sys/crypto/fmt` → `@sys/cli/fmt` → `@sys/process` → eager `Deno.stdout` access. Another is
   the educational application's client common barrel exporting `Open` from `@sys/process`.
3. **Node compatibility is neither Web Standards portability nor a Deno compatibility layer.** It
   cannot supply `Deno.cwd`, subprocesses, browser DOM, IndexedDB, or a persistent host filesystem.
   More subtly, Cloudflare documents `util.types.isProxy` as unimplemented. That blocks security
   contracts in R2 manifest admission, Dist verification, ZIP admission, and server disposal even
   though `node:util` itself is importable.
4. **Keep intentional host and browser functionality.** Filesystem ownership, process execution,
   terminal interaction, workspace/build tooling, platform signing, browser editors, and UI
   rendering do not need to become Workers libraries. Maintain their boundaries instead.
5. **No new Workers declaration is justified by execution evidence from this audit.** There was no
   Workers runtime or bundle validation. Three reviewed, offline Deno test commands stopped at
   TypeScript checking, before running test bodies. Existing registry declarations need qualified
   entrypoint-level interpretation: `@sys/types`, `@sys/crypto`, and, outside the `@sys` scope,
   `@tdb/data` currently report `workerd: true`.

**Coverage:** exhaustive package/configuration inventory and package-level architectural assessment;
focused transitive traces of foundational, candidate, and blocking boundaries. This is **not** an
exhaustive resolved closure of every implementation file and external dependency branch. Those gaps
are explicitly recorded rather than converted into passing claims.

**Recommended first maintenance change:** make the no-argument `Is.localhost()` branch reject a
navigator-only, windowless environment safely, without changing `Is.browser()` globally. It is a
small, directly evidenced defect in a foundational public leaf. See §9. Do not treat that fix as a
package-wide Workers certification.

This document is the only persistent audit change. No source, configuration, dependency, lockfile,
JSR metadata, installation, deployment, publishing, or Git mutation was performed.

## 2. Scope and methodology

### 2.1 Baseline and inventory reconciliation

- Repository: `/Users/phil/code/org.sys/sys`; report originally placed at repository root.
- Runtime observed: Deno **2.9.7**, V8 **15.0.245.2-rusty**, TypeScript **6.0.3**,
  `aarch64-apple-darwin`.
- Root `deno.json` lists **57 workspace members**: **49 `@sys` modules** and **8 deploy/sample
  modules**. All 57 owning configurations were opened. `@sys/driver-crdt` is private and exports
  nothing; `@sys/html` exists locally but has no published version.
- The JSR `sys` inventory returned **49 package records**, including unpublished `html` and
  published `tmp`. `@sys/tmp@0.0.125` has no active workspace directory. Thus the `@sys` inventory
  is **50 distinct identities**: 49 active modules plus the registry-only probe, with **48
  published**.
- The other non-private workspace identities were checked individually: `@draft/shell` returned
  `packageNotFound`; `@tdb/data@0.0.118`, `@tdb/edu-slug@0.0.186`, and `@tdb/slc-std@0.0.161` are
  published. Including deploy/sample members, §3 accounts for **58 distinct identities**, **51 with
  observed published versions**. This is workspace coverage, not an audit of unrelated packages
  elsewhere in the `draft` or `tdb` scopes.
- Registry versions matched the local configured versions for the published active identities.
  Matching version strings are **not** a byte-for-byte artifact equivalence proof.
- Pre-existing tracked edits were limited to four agent plan paths; numerous untracked agent plans
  were also present. They were not edited. Closing Git status showed the same pre-existing path set
  plus this report; HEAD remained unchanged. No assertion is made about byte identity of someone
  else's concurrent plan work.

Inventory authorities: `deno.json`, each matrix-linked owning `deno.json`, `imports.json`,
`deps.yaml`, `deno.graph.json`, and public registry responses. `deno.graph.json` records
workspace/package ordering and dependency edges, including non-production coupling; it is not an
entrypoint runtime closure.

### 2.2 Method and evidence levels

1. Read package names, versions, exports, publish/private settings, tasks, permission presets,
   import mappings, dependency authority, and CI configuration.
2. Screen source paths for runtime globals, Node built-ins, browser APIs, dynamic loading, workers,
   code generation, and environment/clock assumptions. Search results only located candidates;
   opened source governed conclusions. Comments, types, test fixtures, and error labels such as
   `node:duplicate-key` were not counted as runtime imports.
3. Follow representative public entrypoints through re-exports, shared barrels, internal modules,
   and foundational `@sys` leaves. Separate eager module evaluation from deferred invocation.
4. Inspect selected installed external manifests and implementations, particularly conditional
   exports, native/WASM initialization, and dynamic evaluation. Retrieve official documentation and
   selected versioned JSR sources using unauthenticated GET requests.
5. Review the effects of selected existing tests before invoking their owning tasks. Keep dependency
   resolution offline and frozen; do not install, populate repository `node_modules`, or run broad
   tests, browser builds, live registry tests, R2 writes, or deployment tasks.
6. Record uncertainty per package/entrypoint and prescribe the smallest next validation.

Evidence notation used below:

- **S1:** configuration/root and domain-boundary screening; not a complete leaf closure.
- **S2:** focused source/import-chain trace, including relevant shared barrels.
- **S3:** selected external implementation, conditional export, or versioned artifact inspected.
- **T×:** a Deno test command was attempted but failed during type checking; zero test bodies ran.
- **W—:** no Workers bundling or execution. This applies to **every row**.
- **H/M/L:** high/medium/low confidence in the stated _static finding_, not a probability of passing
  a future runtime test. An observed blocker may have H confidence while a neighboring candidate is
  M.

A negative architectural verdict can be established by one required unavailable capability; it does
not require reading every file in a deliberate host-only subtree. A positive package-wide claim
requires substantially stronger coverage. Portable candidate rows therefore remain conditional.

### 2.3 External facts and their limits

Official sources consulted on the assessment date:

| Source                                                                               | Fact used                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <https://jsr.io/docs/packages>                                                       | Runtime compatibility is package-author-controlled Settings metadata; not a test result.                                                                                                                                    |
| <https://jsr.io/docs/with/cloudflare-workers>                                        | Workers consumes JSR through the npm compatibility layer; distribution and runtime capabilities are separate.                                                                                                               |
| <https://developers.cloudflare.com/changelog/post/2026-08-04-nodejs-compat-default/> | Compatibility dates from `2026-08-04` enable Node compatibility and v2 by default.                                                                                                                                          |
| <https://developers.cloudflare.com/workers/runtime-apis/nodejs/>                     | Supported APIs, partial implementations, injected polyfills, and non-functional stub modules must be distinguished. Child processes and worker threads are stubs, not usable host facilities.                               |
| <https://developers.cloudflare.com/workers/runtime-apis/nodejs/util/>                | `util.types.isProxy`, `isExternal`, `isKeyObject`, and the documented compiled-WASM classifier are not implemented.                                                                                                         |
| <https://developers.cloudflare.com/workers/runtime-apis/nodejs/fs/>                  | Filesystem support is a Worker virtual filesystem, not persistent access to an application's host directory tree.                                                                                                           |
| <https://developers.cloudflare.com/workers/runtime-apis/web-standards/>              | No dynamic `eval`/`new Function` or runtime compilation of WASM bytes; timers/fetch need request context; clocks do not advance during CPU-only execution. `navigator.userAgent` can be available without a browser window. |
| <https://api.jsr.io/scopes/sys/packages?limit=100>                                   | Package/version and current compatibility inventory. Missing `workerd` is distinguished from explicit `false`.                                                                                                              |

For a future standards-only test at a date on/after `2026-08-04`, remove positive Node flags and use
**both** `no_nodejs_compat` and `no_nodejs_compat_v2`. A second, separate lane can test the same
package with the documented default Node support. Pin and record the compatibility date and
runtime/tool versions. None of these flags were configured or exercised here.

The supplied acquisition/convergence narrative and future `celld` capabilities were **not
independently established**. No compatibility conclusion depends on them. A self-hosted `workerd`
embedder's capability bindings and a hosted Workers isolate are not interchangeable evidence.

### 2.4 Validation executed

Each command ran from its owning module. The tests were selected after opening the test files,
registration barrels, and local runtime-graph scanner. They exercise fixed crypto vectors or local
source boundaries—not external service operations. The named package `test` permission preset was
selected by the declared task; presets merely existing in configuration confer no authority.

```sh
cd /Users/phil/code/org.sys/sys/code/sys/crypto
deno task test --cached-only --frozen --node-modules-dir=manual ./src/m.Hash/-test/-digest.test.ts ./src/m.Sign.Ed25519/-test/-.test.ts

cd /Users/phil/code/org.sys/sys/code/sys/markdown
deno task test --cached-only --frozen --node-modules-dir=manual ./src/m.Markdown/-test/-runtimeGraph.test.ts

cd /Users/phil/code/org.sys/sys/code/sys/html
deno task test --cached-only --frozen --node-modules-dir=manual ./src/m.Html/-test/-runtimeGraph.test.ts
```

| Attempt                 | Result                           | Interpretation                     |
| ----------------------- | -------------------------------- | ---------------------------------- |
| Crypto digest/Ed25519   | Exit 1; **29 TypeScript errors** | No vectors or signatures executed. |
| Markdown graph boundary | Exit 1; **16 TypeScript errors** | No graph assertions executed.      |
| HTML graph boundary     | Exit 1; **13 TypeScript errors** | No graph assertions executed.      |

Shared diagnostics included possibly-undefined TinyColor results and string/template-literal return
mismatches in `code/sys/color/src/m.Rgb/u/u.format.ts:37–96`, plus missing assertion `.to`
properties in test consumers and `code/sys/std/src/m.Testing/u.expectError.ts:21,29`. These are
**observed checking failures**, not demonstrated Workers failures of the production crypto or parser
graphs. The broad server-side test barrel accounts for some unrelated dependencies. Their underlying
type-resolution cause was not diagnosed or repaired. No `--no-check`, relaxed checking, dependency
replacement, or permission escalation was attempted.

No full workspace test/check, build, publish dry run, browser harness, or Workers test was run. No
Wrangler/workerd/Miniflare configuration or corresponding executable on PATH was found in the
reviewed workspace/tool probes. Existing CI is Deno/Linux plus selected Chrome/browser and build
proofs; a workflow definition is not a successful run from this audit.

### 2.5 Coverage limitations that remain material

- No automatic, compiler-resolved transitive graph for every public leaf, dynamic import, and npm
  dependency branch was collected. S1/S2/S3 make this visible; §3 is inventory-complete, not a claim
  that every exported operation was examined.
- External closure remains partial for mdast/micromark/hast, `entities`, RxJS's committed browser
  bundle, date-fns, signals, several standard-library leaves, Cliffy, Automerge Repo/network
  adapters, and the S3 client. A dependency manifest or a clean lexical scan cannot replace actual
  resolution.
- Public-type portability was inspected but not checked in an isolated Worker-only TypeScript
  project. Root compiler libraries combine `dom`, `webworker`, and `deno.ns` (`deno.json`), masking
  host namespace requirements.
- Published versioned sources were spot-checked, not compared exhaustively with local source or npm
  compatibility artifacts. They confirm key crypto/CLI/process and types-testing edges, but not
  every downstream release graph.
- No bundle size, startup/CPU/memory limits, WASM asset packaging, request-context lifetime, or
  deployed platform behavior was measured. Local workerd validation, when added, will still be
  separate from hosted execution.

## 3. Exhaustive package compatibility matrix

### 3.1 Reading the matrix

Classification definitions:

- **Portable:** the specified production surface is a Web Standards/JavaScript candidate without an
  observed required host dependency; this is a static assessment, not a passing test.
- **Workers-compatible:** operations depend on supported Workers facilities, potentially Node
  compatibility, with the dependency and settings stated. **No whole package is newly awarded this
  classification on runtime evidence here.**
- **Adaptable:** a useful portable subset exists but exposed graph/API/type boundaries need small
  isolation or capability checks before a broad claim.
- **Coupled:** required host/browser/native assumptions pervade the assessed useful surface; a
  portability change would be architectural rather than a small declaration/validation step.
- **Intentional:** host/browser capability is the product's purpose; no migration recommended.
- **Unverified:** insufficient evidence for a positive or negative useful-surface verdict.

Columns are explicit about publication, exports, runtime dependencies, classification, Workers
assessment, validation/coverage, blockers, remediation complexity, and confidence. Package names
link to the source of their complete export mapping. `.` means the package root; `/t` means a public
type entry, **not** a runtime proof. Metadata-only roots are called out. Multiple classifications
mean multiple entrypoint domains, not inconsistency.

Registry Workers settings: **T** = explicit true, **F** = explicit false, **?** = unspecified.
Settings are observations, not endorsements. Complexity: **0** validation only, **S** bounded
guard/import/type change, **M** several boundaries/adapters, **L** topology or semantic redesign,
**—** deliberately no portability work. All rows have **W—**.

### 3.2 Core libraries: 26 active modules

| Package                                            | Published JSR / Workers setting | Public entrypoints                                                                                                                              | Runtime-specific dependencies                                                                                                                               | Classification                                                    | Workers assessment                                                                                       | Coverage / validation | Main blockers or next proof                                                                                           | Complexity                 | Confidence                   |
| -------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------- |
| [@sys/types](../../../code/sys/types/deno.json)             | 0.0.305 / T                     | `.`, `/t`, `/testing`                                                                                                                           | Production root mostly type-only; `/testing` registers `Deno.test`; some public DOM types                                                                   | Portable production; Intentional testing                          | Root/type candidate, not a portable BDD runner                                                           | S2/S3                 | Worker-only type check; document/exclude Deno test adapter from claim                                                 | 0/S                        | H boundary, M types          |
| [@sys/crdt](../../../code/sys/crdt/deno.json)               | 0.0.209 / F                     | `.`, `/t`                                                                                                                                       | Abstract types and metadata; no Automerge implementation at root                                                                                            | Portable                                                          | Ready for type/import validation                                                                         | S2                    | Isolated type closure; no CRDT execution implied                                                                      | 0                          | H root, M closure            |
| [@sys/std](../../../code/sys/std/deno.json)                 | 0.0.385 / F                     | Minimal `.`, `/t`, and all leaves in §3.6                                                                                                       | `node:util` server predicates; IndexedDB; Deno testing; optional window/clock/cwd operations                                                                | Adaptable; Portable selected leaves; Intentional adapters         | Use a documented leaf allowlist, not a blanket package badge                                             | S2/S3                 | §4.2–4.5; standalone types and request-context behavior                                                               | S/M                        | H blockers, M candidates     |
| [@sys/crypto](../../../code/sys/crypto/deno.json)           | 0.0.324 / T                     | `.`, `/t`, `/fmt`, `/hash`, `/sign`, `/sign/ed25519`                                                                                            | Noble hashes/Web Crypto on core leaves; `/fmt` reaches CLI/process                                                                                          | Portable hash/sign candidates; Adaptable package                  | Validate hash/sign now; `/fmt` blocks an all-runtime-exports claim                                       | S2/S3/T×              | Eager `Deno.stdout` via formatting; Ed25519 runtime proof                                                             | S/M                        | H coupling, M Workers        |
| [@sys/color](../../../code/sys/color/deno.json)             | 0.0.280 / ?                     | `.`, `/t`, `/rgb`, `/ansi`                                                                                                                      | TinyColor JS; guarded ANSI Deno color preference                                                                                                            | Portable runtime candidate                                        | Ready for root/RGB/ANSI validation                                                                       | S2/S3                 | External/type closure; observed TinyColor checking failures                                                           | 0/S                        | M                            |
| [@sys/event](../../../code/sys/event/deno.json)             | 0.0.183 / ?                     | Metadata `.`, `/t`, `/bus`, `/cmd`, `/cmd/testing`                                                                                              | Rx/timers; caller-supplied WebSocket adapter; in-memory test fixture                                                                                        | Portable selected operations                                      | Bus/Cmd/local fixture candidates; test real WebSocket semantics separately                               | S2                    | Timer/request lifetime and MessageEvent/WebSocket behavior                                                            | 0                          | M                            |
| [@sys/immutable](../../../code/sys/immutable/deno.json)     | 0.0.173 / F                     | `.`, `/t`, `/core`, `/graph`, `/rfc6902`, `/url`                                                                                                | JS state/proxies, fast-json-patch, signals/Rx; no observed host IO in inspected leaves                                                                      | Portable candidate                                                | Ready for mutation/event/graph validation                                                                | S2                    | Complete external closure and state/event semantics                                                                   | 0                          | M                            |
| [@sys/schema](../../../code/sys/schema/deno.json)           | 0.0.249 / ?                     | `.`, `/t`, `/primitives/t`, `/recipe`, `/testing`                                                                                               | TypeBox; YAML and immutable helpers via common barrel; `/testing` is type-only                                                                              | Portable interpreted-validation candidate                         | Ready for validation without unsafe evaluation                                                           | S2/S3                 | TypeBox fallback/recursive/format tests and YAML selected branch                                                      | 0/S                        | M                            |
| [@sys/yaml](../../../code/sys/yaml/deno.json)               | 0.0.206 / F                     | `.`, `/t`, `/core`, `/cli`                                                                                                                      | YAML npm conditional exports; `/cli` filesystem/CLI                                                                                                         | Portable core candidate; Intentional CLI                          | Core validation first; package remains mixed                                                             | S2/S3                 | Browser/default versus Node resolver branch; config editing is host-only                                              | 0/S                        | H split, M runtime           |
| [@sys/text](../../../code/sys/text/deno.json)               | 0.0.335 / F                     | Metadata `.`, `/t`, `/block`, `/diff`, `/filter`, `/gpt`, `/update`                                                                             | diff JS; GPT vocabulary/static data; std URL helpers                                                                                                        | Portable non-GPT candidates; Unverified GPT resources             | Validate small transforms; measure `/gpt` separately                                                     | S2/S3                 | GPT bundle/startup/memory budgets; complete dependency closure                                                        | 0/S                        | M; L budgets                 |
| [@sys/markdown](../../../code/sys/markdown/deno.json)       | 0.0.23 / F                      | `.`, `/t`                                                                                                                                       | mdast/micromark/hast; frontmatter uses YAML; no observed FS/UI root edge                                                                                    | Portable candidate                                                | Strong candidate for parser/serializer/HTML validation                                                   | S2/S3/T×              | External closure, conditional YAML, sanitizer behavior; graph test did not run                                        | 0                          | M                            |
| [@sys/html](../../../code/sys/html/deno.json)               | **No version** / F              | `.`, `/t`                                                                                                                                       | parse5 8.0.1 → entities; no browser DOM requirement in parsing API                                                                                          | Portable candidate                                                | Validate before first publication/declaration                                                            | S2/S3/T×              | parse/fragment/type tests and external closure; graph test did not run                                                | 0                          | M                            |
| [@sys/esm](../../../code/sys/esm/deno.json)                 | 0.0.100 / ?                     | `.`, `/t`, `/core`, `/deps`, `/testing`                                                                                                         | Core text/topological operations; `/deps` and scanner import FS                                                                                             | Portable core candidate; Intentional host leaves                  | Core only; not FS scanning/collection                                                                    | S2                    | Confirm all core methods; existing scanner is not a full resolved graph                                               | 0/S                        | H split, M core              |
| [@sys/http](../../../code/sys/http/deno.json)               | 0.0.334 / ?                     | `.`, `/t`, `/client`, `/cmd`, `/server`, `/server/file-bytes`, `/server/host`, `/server/lifecycle`, `/server/proxy`, `/server/static`, `/serve` | Root assembles client and Deno server; client exposes browser surfaces/Net; byte responder isolated                                                         | Coupled root; Adaptable client; Portable byte-responder candidate | `/server/file-bytes` strongest existing leaf; fetch subset needs proof/isolation                         | S2                    | Eager host root; browser caching/registration semantics; public Deno types                                            | 0/S/M                      | H boundaries, M candidates   |
| [@sys/registry](../../../code/sys/registry/deno.json)       | 0.0.329 / ?                     | Metadata `.`, `/t`, `/jsr` = `/jsr/client`, `/jsr/server`, `/npm`, `/npm/client`, `/npm/server`                                                 | Clients use `/http/client`; JSR server uses FS; npm server common reviewed separately                                                                       | Adaptable clients; Intentional JSR server                         | Offline fixture-fetch candidate; no live registry requirement for first proof                            | S2                    | Inherited HTTP client graph/types; npm server is not assumed portable from aliasing                                   | S/M                        | M                            |
| [@sys/net](../../../code/sys/net/deno.json)                 | 0.0.157 / ?                     | `.`, `/t`                                                                                                                                       | Default listener/probe uses `Deno.listen` and Deno errors                                                                                                   | Intentional host port utilities                                   | Importability does not make listener/port selection usable                                               | S2                    | No Deno listener substrate; Workers outbound sockets are a different contract                                         | —                          | H                            |
| [@sys/process](../../../code/sys/process/deno.json)         | 0.0.322 / F                     | `.`, `/t`, `/process`                                                                                                                           | Eager `Deno.stdout`; Deno.Command, signals, host stdio/OS open                                                                                              | Intentional                                                       | Not suitable for Workers operations                                                                      | S2/S3                 | No subprocess/host stdio capability; Node stubs are insufficient                                                      | —                          | H                            |
| [@sys/fs](../../../code/sys/fs/deno.json)                   | 0.0.353 / F                     | `.`, `/t`, `/capability`, `/env`, `/dir`, `/file`, `/filemap`, `/path`, `/observe`, `/pkg`, `/pkg/dist/verify`, `/snapshot`, `/watch`           | Deno filesystem/cwd/env/watch; Node fs; CLI formatting; native proxy predicates                                                                             | Intentional host; Adaptable pure inventory/admission subsets      | Do not declare host FS portable; inspect narrower data-only boundaries                                   | S2                    | Eager cwd on broad root; `isProxy` on verify leaf; realpath/ownership semantics                                       | S/M for isolation; — host  | H                            |
| [@sys/archive](../../../code/sys/archive/deno.json)         | 0.0.5 / F                       | Metadata `.`, `/t`, `/zip`                                                                                                                      | `node:zlib` CRC/inflate plus native proxy admission/server disposal                                                                                         | Coupled security-sensitive ZIP surface                            | **Not validated; Node compatibility alone is insufficient**                                              | S2/S3                 | Documented missing `isProxy`; native inflater lifecycle and resource limits                                           | M/L                        | H blocker                    |
| [@sys/cli](../../../code/sys/cli/deno.json)                 | 0.0.320 / F                     | `.`, `/t`, `/core`, `/keyboard`, `/fmt`, `/fmt/code`, `/shell`, `/testing`                                                                      | Cliffy, host stdio, process barrel; formatting also reaches Screen                                                                                          | Intentional interaction; Adaptable formatting                     | Separate formatting from terminal authority; don't migrate interaction                                   | S2/S3                 | Common Process export and Screen aggregation; Cliffy closure                                                          | S/M                        | H coupling                   |
| [@sys/tmpl-engine](../../../code/sys/tmpl-engine/deno.json) | 0.0.356 / F                     | `.`, `/t`                                                                                                                                       | FS/FileMap/CLI for file-template operations                                                                                                                 | Intentional                                                       | Not presently suitable as implemented                                                                    | S2                    | Filesystem operations are the API, not incidental build dependencies                                                  | —                          | H                            |
| [@sys/workspace](../../../code/sys/workspace/deno.json)     | 0.0.159 / ?                     | `.`, `/t`, `/bump`, `/ci`, `/cli`, `/delta`, `/graph`, `/info`, `/pkg`, `/prep`, `/resolve`, `/run`, `/upgrade`, `/testing`                     | FS/process/registry/CLI shared barrel; repository/package lifecycle                                                                                         | Intentional                                                       | Keep host tool; no blanket promotion of mathematical-looking leaves                                      | S2                    | Shared host imports and required repository effects                                                                   | —; S optional isolation    | H purpose                    |
| [@sys/cell](../../../code/sys/cell/deno.json)               | 0.0.85 / F                      | `.`, `/t`, `/cli`                                                                                                                               | Folder-shaped host composition, service/process orchestration                                                                                               | Intentional                                                       | Existing Cell is not evidence of `celld` support                                                         | S1/S2                 | Host startup/storage topology; CLI main branch is not the only coupling                                               | —                          | H purpose, M full graph      |
| [@sys/server](../../../code/sys/server/deno.json)           | 0.0.58 / F                      | Metadata/main `.`, `/t`, `/bootstrap/status`, `/dist`, `/dist/server`, `/dist/service`, `/files`, `/files/service`, `/files/t`, `/websocket`    | Deno listener/files/process compositions behind useful leaves                                                                                               | Intentional; Unverified narrow status/data subsets                | Metadata root says nothing about server portability                                                      | S1/S2                 | Host listeners and storage; any data-only extraction needs a separate trace                                           | —/S                        | H purpose, M leaf scope      |
| [@sys/web](../../../code/sys/web/deno.json)                 | 0.0.12 / F                      | Metadata `.`, `/t`                                                                                                                              | Endpoint contracts rather than an exposed host server implementation                                                                                        | Portable root/type candidate                                      | Ready for isolated contract/type validation; no endpoint runtime implied                                 | S2                    | Worker-only public-type closure                                                                                       | 0                          | H root, M types              |
| [@sys/testing](../../../code/sys/testing/deno.json)         | 0.0.344 / F                     | `.`, `/t`, `/spec`, `/server`, `/server/dom`, `/web`                                                                                            | Root re-exports std's Deno BDD adapter; server adds FS/browser-process tools; `/web` provides fetch/WebSocket/property fixtures but shares a testing barrel | Intentional Deno/server testing; Unverified spec/web subsets      | Existing Web Standards fixtures may support a later proof lane; they do not make the BDD runner portable | S2                    | Separate fixture behavior from Deno registration/types and browser launch; verify complete `/web` and `/spec` closure | S/M subsets; — host runner | H domains, M fixture closure |

### 3.3 Drivers: 11 active modules

| Package                                                                 | Published JSR / Workers setting | Public entrypoints                                                                 | Runtime-specific dependencies                                                                         | Classification                                        | Workers assessment                                                                 | Coverage / validation | Main blockers or next proof                                                         | Complexity                             | Confidence                  |
| ----------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------- | -------------------------------------- | --------------------------- |
| [@sys/driver-cloudflare](../../../code/sys.driver/driver-cloudflare/deno.json)   | 0.0.44 / ?                      | Metadata `.`, `/t`, `/r2`                                                          | Signed S3 HTTP client; Files model; `/r2` eagerly assembles ReadRoute with Node/fs verification graph | Adaptable Service/Files; Coupled `fromDist` admission | Name/provider is not Workers proof; `fromDist` has a documented capability blocker | S2/S3                 | `util.types.isProxy`; fs capability reachability; no native Worker R2 binding proof | S/M; admission contract decision first | H blocker, M transport      |
| [@sys/driver-automerge](../../../code/sys.driver/driver-automerge/deno.json)     | 0.0.336 / ?                     | `.`, `/t`, `/debug`, `/fs`, `/web`, `/web/ui`, `/ws`, `/ws/client`                 | Automerge WASM/Repo; NodeFS, IndexedDB, WebSocket adapters; worker/host command exports               | Adaptable core; Intentional adapters                  | Upstream workerd export is promising; wrapper is not thereby validated             | S2/S3                 | Select `workerd` WASM branch; Repo closure; host/worker graph and lifecycle         | M                                      | H distinctions, M candidate |
| [@sys/driver-crdt](../../../code/sys.driver/driver-crdt/deno.json)               | **Private; no registry record** | **No exports**                                                                     | Deno native engine/worker/process experiment fixtures                                                 | Intentional internal research                         | No published compatibility claim to make                                           | S1/S2                 | Experimental evidence is not a production driver or Workers harness                 | —                                      | H                           |
| [@sys/driver-deno](../../../code/sys.driver/driver-deno/deno.json)               | 0.0.408 / F                     | Metadata `.`, `/t`, `/cloud`, `/runtime`                                           | Deno configuration/tasks/upgrade/cloud deployment; FS/process                                         | Intentional                                           | Keep host/deployment driver; cloud API fragments are not a package migration       | S1/S2                 | Deno tooling and deployment authority                                               | —                                      | H purpose                   |
| [@sys/driver-process](../../../code/sys.driver/driver-process/deno.json)         | 0.0.146 / F                     | Metadata `.`, `/t`, `/ffmpeg`, `/git`                                              | FS, Process, external Git/FFmpeg programs                                                             | Intentional                                           | Not suitable for Workers execution                                                 | S2                    | External executables/host directory state                                           | —                                      | H                           |
| [@sys/driver-signer](../../../code/sys.driver/driver-signer/deno.json)           | 0.0.123 / ?                     | Metadata `.`, `/t`, `/core`, `/dist`, `/apple`                                     | Signing/distribution artifacts; common FS; Apple platform tooling                                     | Intentional; core metadata/type island                | No platform-signing claim for Workers                                              | S1/S2                 | Artifact FS and signing tools; empty core namespace is not signing execution        | —                                      | H purpose                   |
| [@sys/driver-vite](../../../code/sys.driver/driver-vite/deno.json)               | 0.0.480 / F                     | `.`, `/t`, `/config`, `/entry`, `/main`, `/service`, `/plugins`, `/sample-imports` | Deno resolver plus Vite/Rollup/build/native toolchain and host serve                                  | Intentional build/host runtime                        | Can build portable consumers; driver itself is not an edge library                 | S1/S2                 | Build graph/native/runtime host requirements                                        | —                                      | H purpose                   |
| [@sys/driver-pi](../../../code/sys.driver/driver-pi/deno.json)                   | 0.0.146 / F                     | `.`, `/t`, `/core`, `/cli`, `/cli/raw`                                             | Agent host integration, filesystem/process/terminal/runtime packaging                                 | Intentional                                           | Not suitable as a Workers agent host                                               | S1/S2                 | Host authority and launcher semantics                                               | —                                      | H purpose                   |
| [@sys/driver-monaco](../../../code/sys.driver/driver-monaco/deno.json)           | 0.0.298 / ?                     | `.`, `/t`, `/crdt`, `/dev`, `/vite`                                                | Browser editor/React/DOM/workers; Vite leaf is build-time host integration                            | Intentional                                           | Browser application/bundle target, not Workers execution                           | S1/S2                 | DOM/editor substrate; do not count `/vite` as consumer runtime by name alone        | —                                      | H purpose                   |
| [@sys/driver-prosemirror](../../../code/sys.driver/driver-prosemirror/deno.json) | 0.0.280 / ?                     | `.`, `/t`                                                                          | React, ProseMirror view, Automerge editing                                                            | Intentional                                           | Editor API unavailable as a Workers UI                                             | S1/S2                 | Browser view/DOM and CRDT dependency graph                                          | —                                      | H purpose                   |
| [@sys/driver-stripe](../../../code/sys.driver/driver-stripe/deno.json)           | 0.0.155 / ?                     | Metadata `.`, `/t`, `/ui`, `/server`, `/server/fixture`, `/server/t`               | Browser Stripe JS/UI; server leaf exports local fixture with Env/Fs/HttpServer                        | Intentional UI/local fixture                          | Not a standalone Workers Stripe server SDK merely because `/server` exists         | S2                    | Browser payment UI and local Deno fixture graph                                     | —; S only for a real new use case      | H                           |

### 3.4 UI, models, templates, and tool surfaces: 12 active modules

| Package                                                   | Published JSR / Workers setting | Public entrypoints                                                                                                                                           | Runtime-specific dependencies                                                       | Classification                                   | Workers assessment                                                        | Coverage / validation | Main blockers or next proof                                            | Complexity          | Confidence                 |
| --------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------- | ------------------- | -------------------------- |
| [@sys/ui-state](../../../code/sys.ui/ui-state/deno.json)           | 0.0.133 / ?                     | Metadata `.`, `/t`, `/timecode`                                                                                                                              | Event/Cmd/std state reducers, no React/DOM in inspected playback implementation     | Portable candidate                               | Good playback-state candidate, distinct from media/UI drivers             | S2                    | Deterministic reducer/timeline proof and transitive type closure       | 0                   | M                          |
| [@sys/ui-css](../../../code/sys.ui/ui-css/deno.json)               | 0.0.315 / F                     | `.`, `/t`                                                                                                                                                    | Pure CSS transforms plus Style.Dom/WebFont DOM effects                              | Adaptable mixed surface                          | Pure transformation candidate; not DOM stylesheet support                 | S2                    | Explicit capability/no-op behavior; no portable leaf separation today  | S                   | H split, M complete graph  |
| [@sys/ui-dom](../../../code/sys.ui/ui-dom/deno.json)               | 0.0.327 / F                     | `.`, `/t`, `/events`, `/file`, `/keyboard`, `/local-storage`, `/url`, `/user-agent`                                                                          | Document/window/History/localStorage; some guarded URL/user-agent helpers           | Intentional; selected helpers Unverified         | Don't declare package Workers-ready from URL/user-agent importability     | S2                    | Actual DOM/storage operations absent                                   | —/S narrow use case | H                          |
| [@sys/ui-react](../../../code/sys.ui/ui-react/deno.json)           | 0.0.368 / F                     | `.`, `/t`, `/fc`, `/async`, `/effect`, `/signal`, `/testing/server`, `/use`                                                                                  | React hooks, ui-css/ui-dom common exports; server testing adapter                   | Intentional browser binding                      | React itself does not prove DOM dependence, but these bindings expose it  | S1/S2                 | Hook lifecycle/DOM helpers and testing host graph; no SSR proof        | —                   | H purpose, M subsets       |
| [@sys/ui-components](../../../code/sys.ui/ui-components/deno.json) | 0.0.339 / F                     | Metadata `.`, `/t`, full explicit/alias UI families in §3.6, `/fonts`, `/specs`                                                                              | React/DOM/media/iframe/editor/dev-facing components; Markdown on prose graph        | Intentional                                      | UI leaf support is browser support, not an edge runtime declaration       | S1/S2                 | DOM/media/rendering; each SSR experiment would be separate             | —                   | H purpose                  |
| [@sys/ui-dev](../../../code/sys.ui/ui-dev/deno.json)               | 0.0.368 / F                     | Metadata `.`, `/t`, `/react/devharness`, its `/t`, `/hooks`, `/spec`, `/-test/entry-specs`                                                                   | Browser React inspection/spec harness; build scripts use Vite                       | Intentional development/browser                  | Existing development target is legitimate                                 | S1/S2                 | Interactive browser harness; no Worker validation surface              | —                   | H purpose                  |
| [@sys/ui](../../../code/sys.ui/ui/deno.json)                       | 0.0.47 / ?                      | Metadata `.`, `/t`, `/react/t`, `/react/files`                                                                                                               | Browser UI composition over Files contracts                                         | Intentional                                      | Metadata/root contracts do not make file UI usable in Workers             | S1/S2                 | React/DOM renderer and effects                                         | —                   | H purpose                  |
| [@sys/model](../../../code/sys.model/model/deno.json)              | 0.0.148 / F                     | Metadata `.`, `/t`; `/files`, `/files/fs`, `/files/memory`, `/files/static`, `/timecode/playback`, each also `/t`                                            | Schema/std/Event core; Files common includes deferred Net; `/files/fs` owns host IO | Portable model/memory candidates; Intentional FS | Memory/schema/contracts first; static fetch semantics separately          | S2                    | Public types, inherited Net exposure, schema/YAML resolution           | 0/S                 | H adapter split, M runtime |
| [@sys/model-slug](../../../code/sys.model/model-slug/deno.json)    | 0.0.158 / F                     | Metadata `.`, `/t`, `/bundle`, `/core`, `/client`, `/schema`, `/fs`                                                                                          | Hash/schema/YAML/HTTP client shared barrel; explicit FS adapter                     | Adaptable                                        | Core/schema/client candidates, not automatic portability of common barrel | S2                    | HTTP client/type closure; `/fs` intentionally unavailable              | S/M                 | H FS split, M core         |
| [@sys/tmpl](../../../code/-tmpl/deno.json)                         | 0.0.488 / F                     | `.`, `/t`, `/testing`                                                                                                                                        | CLI/file template copying/updating; bundled browser templates are artifacts         | Intentional                                      | Template output can target browsers/Workers without porting the generator | S1/S2                 | Host generation and testing/build effects                              | —                   | H purpose                  |
| [@sys/dev](../../../code/sys.dev/deno.json)                        | 0.0.236 / F                     | Metadata `.`, `/t`                                                                                                                                           | Browser dev application and Vite scripts outside root runtime graph                 | Intentional development; Portable metadata root  | Root proves metadata only; not a useful Worker dev harness                | S1/S2                 | Domain distinction; test task permits no files                         | —                   | H root/purpose             |
| [@sys/tools](../../../code/sys.tools/deno.json)                    | 0.0.504 / F                     | `.`, `/t`, `/cp` = `/copy`, `/pull`, `/shell`, `/pi`, `/tmpl`, `/crdt`, `/video`, `/serve`, `/deploy`, `/up` = `/upgrade`, `/upgrade/advisory-probe`, `/env` | CLI/FS/process/deploy compositions; main guard does not erase eager imports         | Intentional                                      | Keep host tools; don't run CLI to investigate package metadata            | S1/S2                 | Host authority/effects; any small pure advisory helper needs own trace | —                   | H purpose                  |

### 3.5 Registry-only package and all 8 deploy/sample members

| Package / path                                                           | Published JSR / Workers setting | Public entrypoints                                                                                                      | Runtime-specific dependencies                                                | Classification                                | Workers assessment                                                                   | Coverage / validation | Main blockers or next proof                                            | Complexity     | Confidence            |
| ------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------- | -------------- | --------------------- |
| @sys/tmp; no workspace directory                                         | 0.0.125 / F                     | `.` → `src/mod.ts`                                                                                                      | Three string exports; versioned metadata graph has no imports                | Portable probe                                | Trivial import candidate, not a useful maintenance priority                          | S3                    | No local release authority; no runtime test                            | 0              | H static              |
| [@draft/shell](../../../deploy/@draft.shell/deno.json)                            | Registry `packageNotFound`      | `.`, `/t`, `/ui`                                                                                                        | ShellStructure contracts plus browser composition/Vite/Cell development      | Intentional UI; root subset Unverified        | No publication/declaration recommendation                                            | S1/S2                 | Browser application versus contract subset                             | —/0 subset     | M                     |
| [@tdb/data](../../../deploy/@tdb.data/deno.json)                                  | 0.0.118 / **T**                 | Metadata `.`, `/slug`, `/slug/t` = `/slug/types`, `/slug/cli`, `/slug/fs`, `/slug/ui`, `/slug/ui/dev`, `/slug/ui/dev/t` | Slug HTTP/YAML/schema client; explicit filesystem pipeline and UI adapters   | Adaptable package; Intentional FS/UI          | Existing badge needs scoped interpretation; `/slug` is a candidate, not every export | S2                    | Client/type closure; host stage CLI and browser UI remain incompatible | S/M            | H split, M client     |
| [@tdb/edu-slug](../../../deploy/@tdb.edu.slug/deno.json)                          | 0.0.186 / ?                     | Metadata `.`, `/t`, `/compiler`, `/client`, `/ui`                                                                       | Common barrel exports host `Open`; compiler has FS composition; UI browser   | Coupled client/compiler graph; Intentional UI | Current client reaches process despite its name                                      | S2                    | `src/common/libs.ts:6` → Process root → eager stdout                   | S/M            | H edge, M whole graph |
| [@tdb/slc-std](../../../deploy/@tdb.slc.std/deno.json)                            | 0.0.161 / ?                     | Metadata `.`, `/t`, `/ui`                                                                                               | Standard data helpers and browser UI                                         | Intentional UI; Unverified contracts          | Root/type candidate only; no useful Worker API proven                                | S1/S2                 | Type closure and UI operation scope                                    | 0 subset; — UI | M                     |
| [@tdb/slc](../../../deploy/@tdb.slc/deno.json)                                    | Private                         | `.`, `/t`, `/ui`, `/specs`                                                                                              | Browser App composition and host dev/build tooling                           | Intentional                                   | Not a public Workers package                                                         | S1/S2                 | Browser app; no target migration requested                             | —              | H purpose             |
| [@tdb/slc-fs](../../../deploy/@tdb.slc.fs/deno.json)                              | Private                         | `.`, `/t`                                                                                                               | Filesystem build/static artifact and local Deno serve tasks                  | Intentional                                   | Serving generated assets at the edge is distinct from running this builder           | S1/S2                 | Host build/serve; test task is a no-op                                 | —              | H purpose             |
| [@sample/proxy](../../../deploy/sample.proxy/deno.json)                           | Private                         | `.`; runtime `src/entry.ts`                                                                                             | `@sys/http/server` proxy plus `Deno.serve`                                   | Intentional sample                            | Not an existing Worker proxy fixture                                                 | S2                    | Deno listener/server graph; test task is `true`                        | —              | H                     |
| [@sample/r2](../../../code/sys.driver/driver-cloudflare/-sample/deploy/deno.json) | Private                         | `.`, `/t`                                                                                                               | Explicitly Deno R2-backed UI/JSON application; host builds and signed pushes | Intentional sample                            | R2-hosted assets do not establish Workers runtime support                            | S2                    | Deno entry; local proof/net and mutation tasks are not Workers tests   | —              | H                     |

### 3.6 Complete export-family accounting for large surfaces

The matrix's compact family notation is not a wildcard export assumption. These names were read from
the owning configurations; the linked configurations retain exact source mappings.

**`@sys/std`:**

- Root/type: `.`, `/t`.
- Data/predicate/utility candidates: `/alias`, `/args`, `/arr`, `/bytes`, `/delete`, `/effect`,
  `/eql`, `/error`, `/fn`, `/glob`, `/history`, `/ignore`, `/lazy`, `/obj`, `/obj/path`, `/is`,
  `/json`, `/log`, `/media-type`, `/num`, `/path`, `/pkg`, `/random`, `/regex`, `/semver`, `/shard`,
  `/str`, `/try`, `/url`, `/xml`. Method-level qualifications include `/is` window inference,
  `/path` implicit cwd, `/url` Deno address types, and unresolved external closures.
- Request/lifecycle/reactivity candidates: `/async`, `/dispose`, `/rx`, `/signal`, `/time`,
  `/timecode`. Test inside a request and distinguish pure state/date work from timers/RAF/clock
  semantics. `/dispose/compat` is an **explicit module side effect** installing missing disposal
  symbols, not a host-IO adapter or a full resource-management polyfill.
- Guarded string formatting: `/ansi/server`, `/semver/server`. The suffix alone does **not**
  establish Deno dependence: Semver's server extension adds guarded ANSI formatting, not
  filesystem/network.
- Native-introspection contracts: `/is/server`, `/dispose/server`; full proxy-sensitive contract
  presently blocked by documented Workers support, not just configuration.
- Browser storage: `/indexeddb`.
- Deno/browser-mock test adapters: `/testing`, `/testing/server`, `/testing/server/dom`.

**`@sys/ui-components`:** `.`, `/t`; each name below has both an unprefixed leaf and a `/react/`
prefixed leaf, mapped to the same implementation:

`action-probe`, `anchor`, `bullet`, `bullet-list`, `button`, `buttons`, `buttons/icons`,
`buttons/switch`, `chip`, `cropmarks`, `error-boundary`, `fade-element`, `http-origin`, `icon`,
`icon-swatches`, `iframe`, `image/svg`, `key-value`, `layout/center-column`, `layout/rect-grid`,
`layout/split-pane`, `layout/tabs`, `layout/tree-host`, `media`, `media/recorder/dev`,
`media/timecode/playback-driver`, `object-view`, `path-view`, `player`, `player/youtube`, `preload`,
`prose`, `sheet`, `slider`, `splash`, `spinners`, `text`, `tree-view`, `tree-view/index`,
`vimeo-background`.

Additional non-paired leaves: `/react`, `/react/dev`, `/fonts`, `/specs`. These are all accounted
for as browser/UI or test/development surfaces at S1/S2; **each component's full SSR/runtime closure
was not traversed**. Metadata-root isolation is strong architectural evidence, not a certification
of those leaves.

**Other aliases and type families:** registry `/jsr` and `/jsr/client` share a target; tools `/cp`
and `/copy`, and `/up` and `/upgrade`, share targets. Every `/t` partner in `@sys/model` and every
DevHarness-specific export is included in its owning matrix row. `/t` entries can transitively carry
host or DOM types despite erasing at runtime.

## 4. Runtime dependency findings

### 4.1 F01 — Shared runtime barrels spread host evaluation into unrelated helpers

**Observed; high confidence. Runtime/import-time coupling, not merely a development dependency.**

```text
@sys/crypto/fmt
  → code/sys/crypto/src/m.Fmt/common.ts:1
  → @sys/cli/fmt
  → CLI common re-exports
  → code/sys/cli/src/common/libs.ts:2: Process from @sys/process
  → Process module → m.Process.ts → u/u.stdout.ts
  → code/sys/process/src/m.process/u/u.stdout.ts:29–34: eager Deno.stdout
```

`HashFmt` uses string formatting/width helpers (`code/sys/crypto/src/m.Fmt/m.HashFmt.ts:1–40`), not
subprocess execution. Yet ordinary unbundled evaluation of its graph requires Deno before calling a
formatter. Tree-shaking may remove some edges in a particular bundle; that is an additional build
claim, not an ESM portability guarantee.

There is a second path even if the common Process re-export is removed:
`code/sys/cli/src/m.core/m.Fmt/u/u.hr.ts:1–2` and
`code/sys/cli/src/m.core/m.Fmt.Text/u.width/u.width.ts` import the aggregated Screen module;
`code/sys/cli/src/m.core/m.Screen/mod.ts:1–15` includes repaint;
`code/sys/cli/src/m.core/m.Screen/u.repaint.ts:1,24–27` legitimately owns Process stdout. A complete
formatting isolation pass must address both edges, not just delete one barrel line.

The same mechanism appears in `deploy/@tdb.edu.slug/src/common/libs.ts:6`, which exports `Open` from
`@sys/process`. Importing a named OS-open helper still evaluates that package's other eager process
exports. FS's shared library barrel also exports CLI formatting and HashFmt
(`code/sys/fs/src/common/libs.ts:19–25`), which is unsurprising for terminal tooling but unsuitable
as an accidental dependency of data-only code.

**Impact:** crypto formatting, broad filesystem consumers, educational client/compiler leaves, and
any caller relying on these common barrels. `deno.graph.json` shows the wider dependent ecosystem,
but its package edges alone do not prove all those consumers use the offending runtime leaf.

**Maintenance implication:** narrow the runtime imports at actual capability owners. Do not
introduce an environment facade, duplicate formatters, suppress eager failures, or claim that unused
imported names are harmless. Preserve terminal integrity/authority behavior.

### 4.2 F02 — Importable Node modules can lack required security primitives

**Observed source + official documentation; high confidence capability mismatch.**

`code/sys/std/src/m.Is.Server/common.ts:5` imports `node:util.types`.
`code/sys/std/src/m.Is.Server/m.Native.ts:3–18` captures `isProxy` and other classifiers and
publishes them through `Is.Native`. Cloudflare's util documentation explicitly excludes `isProxy`.

Required downstream uses include:

- `code/sys/std/src/m.Dispose/m.Snapshot/u.until.ts:35–39`: reject proxies during cancellation-array
  snapshotting. The `/dispose/server` contract explicitly requires trap-free native introspection.
- `code/sys/fs/src/m.Pkg.Dist/u.verify/u.input.ts:20,107,148`: refuse proxy records, lifecycle
  arrays, and proxy prototypes before reflective inspection.
- `code/sys.driver/driver-cloudflare/src/m.r2/m.ReadRoute/u/u.dist.ts:13,23,45,70`: proxy-sensitive
  manifest-route admission.
- `code/sys/archive/src/m.Zip/u/u.input.ts:107` and subsequent record checks: bounded ZIP input
  admission; `u/u.failure.ts` and `u/u.extract.ts` also use proxy rejection.

**Inference:** these complete contracts cannot be claimed to work in the documented Workers runtime,
even with Node compatibility enabled. A missing/throwing classifier can reject valid operations or
throw. The exact runtime failure shape was not observed in workerd.

**Security constraint:** do **not** replace `isProxy` with a guessed JavaScript predicate, catch and
pretend “not a proxy,” or remove the admission check to obtain portability. Safe options are an
explicit narrower data contract, a genuinely supported authenticated capability, or keeping the
existing surface host-only. Each needs an owner-approved contract decision, not a shim.

**Impact:** the public `/is/server` and `/dispose/server` surfaces, Dist verification/admission,
`R2.ReadRoute.fromDist`, and ZIP operations. This is one underlying capability problem, not several
independent “Node import” findings.

### 4.3 F03 — Browser detection does not establish window/DOM capability

**Observed source; high confidence conditional failure, not an executed Workers test.**

`code/sys/std/src/m.Is/u.browser.ts:13–19` accepts a navigator/userAgent object and excludes Deno.
It explicitly includes browser workers. Workers can expose
`navigator.userAgent = 'Cloudflare-Workers'` without a window. But
`code/sys/std/src/m.Is/m.Is.ts:210–217` calls `window.location.hostname` after `Is.browser()`
succeeds when `Is.localhost()` has no argument.

The public documentation acknowledges that the no-argument form requires a window-like global
(`code/sys/std/src/m.Is/t.ts:145–151`). That restriction must either remain explicitly documented in
Workers claims or be narrowed safely; it cannot be erased by calling the entire predicate leaf
portable. URL/location arguments already take a separate guarded path.

**Inference:** in a navigator-enabled, windowless Worker, that particular call reaches an unbound
window access. The code's use in browser UI is legitimate; the bug is treating navigator detection
as sufficient admission to a window-only operation.

A related semantic difference is already handled without throwing:
`code/sys/http/src/http.client/m.HttpFetch/u/u.byteSize.ts:97–105` refuses browser range probing
when `globalThis.location` is absent. In a Worker classified as browser-like, this may suppress a
useful server-style fallback. This is a behavior-validation question, not evidence of an eager
crash.

`Is.worker()` relies on constructor-name matching (`m.Is.ts:198–205`); recognizing several browser
worker globals does not prove that every edge embedder will be recognized. Do not invent a new
Workers-detection API until a real caller requires it.

**Impact:** the public predicate leaf and callers performing environment-dependent URL/range
behavior. Observed no-argument callers are browser UI consumers; a full non-UI failing application
was not demonstrated.

### 4.4 F04 — Public types carry host assumptions independently of emitted JavaScript

**Observed; high confidence namespace coupling, unverified standalone consumer outcome.**

- `code/sys/std/src/m.Is/m.Is.ts:172–175` and its public library type use `Deno.NetAddr`.
- `code/sys/std/src/m.Url/t.ts:10` puts `Deno.NetAddr` in `Url.parse`'s public signature;
  `code/sys/std/src/m.Url/u.parse.ts:25` uses the same type, while runtime conversion is structural.
- `code/sys/std/src/types.ts:4–51` aggregates these with IndexedDB and testing/server/mock types.
- `code/sys/types/src/t/t.Dom.ts` exposes a `MouseEvent` handler type. Root types are mostly
  abstract, but “type-only” is not proof that Worker-only libraries can name every browser DOM type.
- Test adapters carry actual `Deno.TestDefinition`/`Deno.TestContext` types and Deno test
  registration.

Root compiler options deliberately include DOM, webworker, and Deno namespaces. That is convenient
for this workspace but cannot prove the npm compatibility artifact type-checks in an independent
Worker-only project. TypeScript library setup, emitted declaration boundaries, and which public
symbols are used all affect the consumer result.

**Impact:** standard-library `/t`, URL/predicate clients, and packages that aggregate or refer to
broad standard types. Type-only imports do not cause eager host execution; report them as a distinct
problem.

**Maintenance implication:** test production contracts without `deno.ns`; use local structural
address contracts where the behavior really only needs `{ hostname, port, transport }`, and keep
host/testing signatures at explicit adapters. Do not add ambient Deno types to an edge consumer just
to mask leaks.

### 4.5 F05 — API availability does not imply identical operational semantics

**Observed implementations + platform documentation; medium confidence on unexecuted behavior.**

- **Path:** `code/sys/std/src/m.Path/m/m.Path.ts` re-exports `@std/path` resolution. The inspected
  versioned `@std/path@1.1.6/posix/resolve.ts` and `windows/resolve.ts` call `_common/env.ts` when
  no absolute base is supplied. That helper accesses guarded `globalThis.process?.cwd` or
  `globalThis.Deno?.cwd`, and throws if neither exists. Lexical joins/normalization/explicit bounded
  paths can be portable; implicit host cwd is not. Node-compatible Worker cwd, if available, is not
  the application's persistent host project root.
- **Time/scheduling:** `code/sys/std/src/m.Time/u/u.waitFor.ts:11–20` captures timers and
  `performance.now`; duration/timer helpers use wall clocks. Workers limits timer/fetch operations
  to request context and deliberately changes clock precision/progression. Test
  deadline/cancellation behavior with IO turns; do not assume CPU-only elapsed-time measurement.
- **RAF:** `code/sys/std/src/m.Async.Schedule/u/u.scheduleFunction.ts:5–7,44–56` captures RAF and
  falls back to a timer when absent. This is a useful portability accommodation, but is not a
  display-frame guarantee on Workers.
- **HTTP:** client ServiceWorker registration admits browser location and navigator service-worker
  facilities at invocation (`http.client/m.HttpServiceWorker/u/u.register.ts:14–93`). Guarded
  unsupported results do not make browser registration a supported Workers operation. Browser Cache
  Storage behavior is likewise not automatically equivalent to the Workers Cache API.
- **WebSocket/Worker:** `code/sys/event/src/m.cmd/m.transport/u.from.WebSocket.ts` adapts a
  caller-supplied WebSocket and constructs MessageEvent objects. Test it with actual Worker
  WebSockets. Automerge's browser `new Worker(...)` and Deno publishing/listening helpers are
  separate capabilities, not substitutes for Worker deployment or Durable Object topology.

These are operation/conditional-adapter issues. Most are not reasons to discard otherwise useful
state, bytes, or data transformations.

### 4.6 F06 — Filesystem, process, and network ownership are intentional host contracts

**Observed; high confidence.**

- `code/sys/fs/src/m.Path/m.Path.ts:17` eagerly binds `Deno.cwd`; invoking trimCwd's default also
  reads it at line 19. The broad FS root reaches this host surface. Node VFS support does not supply
  Deno.
- `code/sys/fs/src/m.Fs.capability/m.Rooted/common.ts:4–5` imports Node filesystem constants/open;
  rooted operations have host file identity, realpath, ownership, and lifecycle requirements.
- `code/sys/process/src/m.process/u/u.ts:26–41` constructs `Deno.Command` using Deno's executable
  path; its stdout object already requires Deno during import (§4.1).
- `code/sys/net/src/m.Net/m.Port.ts:9–30` creates a default Deno-listener probe. Host access is
  deferred until operations; `u/u.probe.ts:26–34` references Deno error classes when categorizing
  failures. Successful import or `Port.get(0)` returning zero is not a real listening-port proof.

**Impact:** deliberate host tools, FS adapters, listeners, process drivers, workspace operations,
and compositions importing broad host barrels. Do not rewrite these into a generic portability
layer. Move only accidental reachability from candidate data/client surfaces.

### 4.7 F07 — Cloudflare provider integration and Workers execution are different claims

**Observed source; high confidence on topology and missing classifier; remaining transport closure
M.**

`code/sys.driver/driver-cloudflare/src/m.r2/mod.ts:4–18` eagerly assembles Service, Files, and
ReadRoute. The Service default builds a signed S3-compatible HTTP transport with explicit access-key
credentials (`m.Service/m.create.ts:8–27`; `u/u.transport.s3.ts:6–21`). It is **not** simply a
Worker environment R2 binding. The transport seam and Files adapter are valuable existing
boundaries.

ReadRoute common imports `Pinned` from `@sys/fs/pkg/dist/verify` and server predicates
(`m.ReadRoute/common.ts:1–5`). The verification leaf is narrower than `@sys/fs`: it exports
Inventory, Local, and Pinned, with a dedicated runtime common rather than the broad FS barrel.
However:

- `m.Pkg.Dist/u.verify/u.io.ts:11–16` defines deferred Deno IO closures. Their presence is **not**
  an eager unbound-global exception; invoking local verification is host-only, and `ioFailure`
  references Deno errors on failure paths.
- The graph includes verification/read implementations and rooted path utilities; rooted common
  imports Node fs. An operation that only admits a supplied manifest need not perform disk IO, but
  its evaluated graph and build branch still require examination.
- Manifest admission invokes native proxy/byte classifiers, not merely hash parsing. `fromDist`
  invokes `Pinned.admitManifest` after acquisition
  (`code/sys.driver/driver-cloudflare/src/m.r2/m.ReadRoute/m.fromDist.ts:46–62`) and also calls the
  proxy-sensitive `snapshotDist` path (§4.2).

The S3 client's `0.9.6` configuration and root were retrieved; they show the Client implementation
and an assertion dependency, not a native Worker binding. Its complete implementation closure was
not certified here.

**Conclusion:** candidate Service/Files/explicit-route operations deserve isolation and
fake-transport proofs. **Do not** mark all `/r2`, especially `fromDist`, Workers-ready today.
Extracting an admission leaf alone does not solve missing trap-free introspection, and replacing
security checks to force support is unacceptable.

### 4.8 F08 — External packages require branch-aware analysis, not an npm/JSR heuristic

| Dependency / observed version                           | Evidence and consumer                                                                                                                                                   | Static assessment and remaining proof                                                                                                                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@noble/hashes` 2.4.0, `@std/encoding` 1.0.11           | `code/sys/crypto/src/m.Hash/u.hash.ts:1–56` uses SHA1/SHA256 and byte encoders; Noble manifest/utils inspected                                                          | Pure byte hashing candidate. Inspect actual emitted graph; fixed vectors, Unicode, byte views, hex/Base64 in Worker. Package-manager origin is not a Node blocker.                                                                                                                                |
| Web Crypto Ed25519                                      | `code/sys/crypto/src/m.Sign.Ed25519/u.generateKeyPair.ts:3–9`, `u.sign.ts:4–7`, `u.verify.ts:4–7`                                                                       | Standard API usage; algorithm/key/export and tamper behavior need actual runtime proof. Deno test attempt did not execute.                                                                                                                                                                        |
| `yaml` 2.9.1                                            | Installed `package.json` chooses `node` → CommonJS dist, default → browser ESM; `dist/log.js:3–13` requires process                                                     | Browser/default branch is a standards candidate. A resolver selecting Node changes the graph; test and record the selected branch, not an assumed browser build. EnvRef gets a caller-supplied lookup rather than ambient env (§5).                                                               |
| `typebox` 1.3.34                                        | `m.core.schema/m.Value.ts` wraps Value methods; upstream `build/value/check/check.mjs`, `build/schema/build.mjs`, and `build/system/environment/evaluate.mjs` inspected | Value.Check uses interpreted checking. Upstream evaluation probes/catches unavailable Function and has a dynamic-check fallback. `new Function` exists but is not evidence of mandatory unsafe eval for these operations. Test fallback, recursive schemas, errors, Parse, and formats in Worker. |
| `parse5` 8.0.1 → `entities`                             | `code/sys/html/src/m.Html/common.ts:2`; installed parse5 manifest uses ESM/default export and one dependency                                                            | Parsing an HTML AST does not require live browser DOM. No parser-stream dependency in the exposed core; complete entities/implementation closure still needs bundling/execution.                                                                                                                  |
| mdast/micromark/hast packages                           | Markdown common imports parser/GFM/serializer; HTML/frontmatter modules inspected; versions pinned in `imports.json`                                                    | Strong pure parsing candidate. No entire upstream dependency-tree certification; HTML sanitization and YAML branch must be exercised, not just basic Markdown parse.                                                                                                                              |
| `gpt-tokenizer` 3.4.0                                   | `code/sys/text/src/m.gpt/m.Token.ts:1–24` imports ESM root; manifest and codegen candidates inspected                                                                   | JS ESM runtime with vocabulary costs. Node process references found in upstream codegen are not automatically runtime dependencies. Bundle/startup/CPU/memory measurements remain open.                                                                                                           |
| `@automerge/automerge` 3.5.0                            | Installed manifest has `workerd` export before node/browser/default; `dist/mjs/entrypoints/fullfat_workerd.js:1–8` imports a WASM module and initSyncs it               | Genuine upstream workerd-aware packaging. Select that branch and supply a precompiled WASM module; default/base64 runtime compilation must not be assumed valid. This does not validate wrapper Repo/worker/storage graphs.                                                                       |
| Automerge Repo/adapters 2.5.6                           | Repo manifest/common imports inspected; explicit NodeFS and IndexedDB adapter leaves opened                                                                             | Host and browser adapters are intentional. Repo closure, crypto mapping, network adapters, synchronization, timers/shutdown, and Worker storage topology remain separate proof obligations.                                                                                                       |
| `@bradenmacdonald/s3-lite-client` 0.9.6                 | Versioned config/root and local signed-HTTP transport inspected                                                                                                         | Fetch/signature transport candidate; full SDK closure and Worker request-context behavior unverified. No live credentialed operation was performed.                                                                                                                                               |
| Hono 4.13.12; Stripe browser JS 9.17.0                  | HTTP server common and Stripe fixture/server common opened                                                                                                              | Portable upstream Hono does not make `@sys/http/server` portable. Stripe's browser package is not proof that the wrapper's Deno fixture is a Workers server SDK.                                                                                                                                  |
| Cliffy 1.3.1, Vite 8.3.2/Rollup 4.64.0, Pi agent 0.85.1 | Import authority, owning tasks, runtime/boundary modules                                                                                                                | Terminal/build/agent purposes are legitimate. Count these as runtime only when a public consumer graph actually reaches them; development scripts are not universal consumer dependencies.                                                                                                        |

Installed paths use `node_modules/.deno/<package>@<version>/node_modules/<package>/...`; versioned
JSR evidence uses `https://jsr.io/<package>/<version>/<source-path>`. No installed dependency was
modified or newly installed.

### 4.9 F09 — Existing graph and test infrastructure is valuable but proves less than Workers support

`code/sys/esm/src/m.testing/m.EsmAssert/u.runtimeGraph.ts:12–42,60–73` reads local source, extracts
line-based static import/export specifiers, ignores `import type`/`export type`, traverses
**relative imports only**, and records bare imports without resolving their dependencies. It does
not establish all computed/literal dynamic imports, multiline forms, npm conditional branches, or
public types.

Markdown boundary tests (`code/sys/markdown/src/m.Markdown/-test/-runtimeGraph.test.ts`) forbid FS
and browser/UI substrates. HTML tests (`code/sys/html/src/m.Html/-test/-runtimeGraph.test.ts`) also
forbid Node/streaming/editing/build dependencies and test a narrow public-type boundary. These are
useful local architectural invariants. They were inspected, but this audit's attempted runs stopped
during checking.

The private CRDT experiments provide stronger resolved graph/native-process controls than that
line-based scanner; their own README explicitly limits them to pinned engines, separate Deno probes,
and non-production experiments (`code/sys.driver/driver-crdt/src/-test/README.md`). Neither kind of
control is an existing Workers execution lane.

CI pins Deno 2.9.7 and includes deliberate browser/build/process proofs
(`.github/workflows/test.linux.yaml`, `.github/workflows/build.yaml`). Publishing validates package
identity and Deno tests (`.github/workflows/jsr.yaml`), but does not automatically test Workers.
Permitted-no-files/no-op test tasks in some app/probe modules are not compatibility evidence.

## 5. Existing architectural strengths

These should be preserved, not replaced by a portability framework:

1. **Minimal public roots.** `code/sys/std/src/-exports/mod.ts:5–16` deliberately keeps leaf
   libraries off the root. Model, Event, Registry, Text, UI Components, UI Dev, and several drivers
   similarly expose identity/contracts rather than their entire runtime at root. This reduces
   accidental eager evaluation and makes explicit leaf tests possible.
2. **Explicit adapter leaves.** Model Files separates `/files/fs`, `/files/memory`, and
   `/files/static`; Automerge separates `/fs`, `/web`, and `/web/ui`; YAML separates `/core` and
   `/cli`; Registry has client/server leaves. Those boundaries are real source architecture, even
   when shared type/runtime barrels still need scrutiny.
3. **An already-narrow HTTP byte responder.** `code/sys/http/src/http.server/m.FileBytes/mod.ts`
   exports a function that projects caller-supplied bytes into Response. Its private common is
   explicitly host-free (`http.server/m.HttpServer/u.serveFile/common.ts:1–5`), and content type
   comes from a standard leaf. This is a better candidate than porting the broad server namespace.
   Its own external entry-proof task exists, but was not executed in this audit.
4. **Capability-shaped Files adapters.** Memory, static, FS, and R2 backings share
   data/policy/contracts without pretending the backing effects are identical. Memory watch code has
   in-memory state and Cmd lifecycle rather than filesystem watching. Validate those contracts
   before creating new backend plumbing.
5. **Caller-owned environment resolution.** `code/sys/yaml/src/m.core/m.EnvRef.ts:96–119` uses
   `options.get(item.ref.name)`, not ambient Deno or Node env. This is a concrete portable seam
   already present.
6. **Pure crypto and abstract CRDT roots.** Hashing/signing are separate leaves; `@sys/crdt` is an
   implementation-agnostic type library. A consumer does not have to import Automerge to use its
   abstract contracts.
7. **Guarded optional capabilities.** ANSI obtains Deno from `globalThis` before optional access
   (`code/sys/std/src/m.Ansi/u.stdlib.ts:61–63`); this is **not** an unbound-global
   optional-chaining bug. Schedule has a non-RAF fallback. WebFont returns `injected: false` without
   a DOM (`code/sys.ui/ui-css/src/m.WebFont/u.inject.ts:29–31`). Such guards are strengths, but a
   no-op is not equivalent to a supported DOM operation.
8. **Upstream workerd-aware WASM packaging.** Automerge's dedicated branch is useful evidence to
   build on; retaining adapter separation avoids confusing it with NodeFS/IndexedDB support.
9. **Boundary and lifecycle proof culture.** Existing entry, graph, process, browser, admission, and
   cancellation tests provide places for small targeted additions. `@sys/testing/web` already
   supplies caller-owned Fetch/WebSocket fixtures and exact property-descriptor restoration
   (`code/sys/testing/src/m.web/mod.ts`, `m.Fetch/m.mock.ts`). Verify its full graph before reusing
   it in an edge harness; do not bring the Deno BDD runner along. Keep security invariants and
   declared task/permission ownership intact.

## 6. JSR Cloudflare Workers readiness

### 6.1 Declaration policy

A JSR runtime indicator is package-level, while these packages contain mixed exports. Before any
metadata update, define the supported production entrypoints and intentional exclusions in package
user documentation. Do not interpret the indicator as “any subpath/operation is supported.” If that
scope would mislead a normal consumer, keep the package undeclared rather than relying on a tiny
metadata-root demonstration.

Existing `workerd: true` observations:

- **`@sys/types`:** defensible for ordinary erased type/metadata usage, but not `/testing`'s Deno
  BDD runner; standalone public DOM-type closure remains to be checked.
- **`@sys/crypto`:** credible hash/signing leaves, but `/fmt` has a confirmed versioned host import
  chain. Qualify or repair that boundary before treating the setting as all-public-runtime support.
- **`@tdb/data`:** credible client/data subset, but published exports also include host staging/CLI
  and browser UI. The current setting is not proof of those operations.

Versioned spot checks confirmed crypto/CLI/process and types-testing source edges, with JSR-resolved
version specifiers. They do not establish all npm-generated artifacts or every dependency selected
by future resolution. No setting was changed.

### 6.2 Ready for validation/declaration — not declared ready without validation

These groups need no **observed mandatory runtime rewrite** for the stated operation scope. Type or
resolver findings discovered by the prescribed test may move them into the next group.

| Candidate scope                                                                  | Smallest meaningful validation                                                                                                   | Additional condition before declaration                                                           |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@sys/crdt`, `@sys/web`, production `@sys/types`                                 | Compile named production types in a fresh Worker-only consumer; load metadata root                                               | No ambient Deno dependency; assess public DOM types; explicitly exclude Deno testing API.         |
| `@sys/crypto/hash`, root URI helpers, `/sign/ed25519`                            | Actual Worker request computes fixed SHA1/SHA256 vectors, hex/Base64 and byte views; generate → sign → verify → tamper rejection | Test exact published npm-compatible leaves with Node disabled; `/fmt` remains a separate blocker. |
| `@sys/color` root/RGB/ANSI                                                       | Compute known color conversions and style/strip strings without Deno/window; import root                                         | Resolve current type-check failures separately; inspect TinyColor branch.                         |
| `@sys/immutable` core/RFC6902/graph/URL                                          | Mutation → patch/event observations, retained snapshot, graph traversal and URL normalization                                    | Exercise actual production leaves, no Deno test barrel; inspect external closure.                 |
| `@sys/event/bus`, `/cmd`, `/cmd/testing` local fixture                           | Request-driven local unary/stream commands, cancellation and completion; timer cleanup                                           | WebSocket adapter separately tested; no browser Worker constructor assumed.                       |
| `@sys/schema` root/recipe/type-only testing                                      | Check/Parse/error formatting, recursive schema, invalid input, Standard Schema wrapper with dynamic eval unavailable             | Confirm fallback and formats; record YAML branch; no unsafe-eval bypass.                          |
| `@sys/yaml` core/root                                                            | Parse → AST edits → stringify, aliases/frontmatter, injected EnvRef lookup                                                       | Select and record browser/default branch for standards lane; `/cli` excluded.                     |
| `@sys/markdown`, local unpublished `@sys/html`                                   | Markdown/GFM roundtrip, frontmatter, sanitized HTML; HTML full/fragment parse and source behavior                                | Bundle all external dependencies; fix baseline checking before trusting existing graph tests.     |
| `@sys/text/block`, `/diff`, `/filter`, `/update`                                 | Known transformation/diff/update results via public leaves                                                                       | `/gpt` not covered by small-transform proof; measure it separately.                               |
| `@sys/esm` root/core                                                             | Parse/normalize imports and deterministic topological plan/cycle results                                                         | Confirm each promised method; `/deps` and `/testing` excluded.                                    |
| `@sys/ui-state/timecode`; `@sys/model` schema/playback/memory subsets            | Deterministic timeline/reducer events; memory read/write/list/watch/cancel inside a request                                      | Exclude FS adapter and listening-port operations; verify schema/types closure.                    |
| Selected std data/bytes/disposal/semver/signal leaves; HTTP `/server/file-bytes` | Named-method fixtures; byte response GET/HEAD/status/header/oversize-invalid-input cases                                         | Full method-level allowlist; type check and request-context checks; do not test only the root.    |
| Registry-only `@sys/tmp`                                                         | Import three string constants                                                                                                    | Trivial evidence only; no priority for a release/metadata pass.                                   |

The declaration decision still belongs to the package owner after passing the stated scope—not to
this static report.

### 6.3 Small changes required or boundaries requiring resolution

| Package/scope                                                      | Required maintenance or unresolved boundary                                                                                                     | Smallest next proof                                                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `@sys/std/is` no-argument localhost                                | Actual location capability guard; update window-only comment deliberately                                                                       | Navigator-only/windowless fixture and existing browser/explicit-URL cases (§9).                                          |
| Standard public address/type aggregation                           | Narrow structural production address contract and isolate host testing/type symbols where needed                                                | Worker-only TypeScript consumer without `deno.ns`; declarations from exact artifact.                                     |
| `@sys/crypto/fmt` and CLI formatting                               | Remove common Process reachability **and** broad Screen paths, while preserving formatting/terminal integrity contracts                         | Fresh no-Deno import plus formatter output tests; complete Cliffy closure; re-audit package scope.                       |
| HTTP client, Registry clients, Model-Slug client, `@tdb/data/slug` | Prove useful fetch/data methods independently of browser-only adapters and deferred Net exposure; add a leaf only if graph evidence requires it | Fake/injected fetch responses in a Worker request, cancellation/errors and byteSize range behavior; no live credentials. |
| `@sys/ui-css` pure transformations                                 | Validate/isolate pure transformations rather than promise DOM stylesheet effects                                                                | CSS output without document; explicit no-op/unsupported behavior for DOM methods.                                        |
| `@sys/testing/web` and `/spec` subsets                             | Verify existing fixture/spec closure independently of root Deno registration, broad testing types, and server browser-launch tools              | Fresh fixture import, fake-fetch/WebSocket behavior, exact descriptor restoration and cleanup; no Deno BDD execution.    |
| `@tdb/edu-slug/client`                                             | Move host Open import to actual host owner rather than client common barrel                                                                     | Client import/result test with Deno absent; compiler/FS/UI scopes remain separate.                                       |
| Automerge wrapper core                                             | Workerd export condition/WASM asset packaging, Repo dependency/lifecycle proof, optional worker/host paths                                      | First import/native document mutation in actual workerd; then Repo synchronization/shutdown without FS/IndexedDB.        |
| R2 Service/Files/explicit routes                                   | Isolate supported operation graph; inspect complete S3 client; separate manifest route security boundary                                        | Fake transport bucket/Files/GET/HEAD tests; request-context signing; no remote writes or credentialed operation.         |

“Small changes” is **not** a promise that `isProxy` can be shimmed. R2 `fromDist`, ZIP admission,
and server disposal require a supported capability or an explicit security-contract decision; they
are not default declaration candidates.

### 6.4 Not presently suitable

- Host operation packages: FS as a host filesystem library, Process, Net listening-port utilities,
  CLI interaction/shell, Tmpl/TmplEngine, Workspace, Cell, Server host services, Tools,
  Deno/Process/Signer/Vite/Pi drivers; Testing's Deno BDD/server/browser-launch operations.
- Browser operation packages: UI-DOM, UI-React bindings, UI Components/Dev/UI compositions,
  Monaco/ProseMirror editors, Stripe payment UI and its local Deno fixture, DOM CSS operations,
  IndexedDB adapters.
- Security-sensitive complete surfaces depending on unavailable `util.types.isProxy`: `/is/server`,
  `/dispose/server`, Dist verification/admission, R2 manifest-derived routes, and ZIP.
- Private experiments/applications and metadata-only roots as evidence of useful execution.

Useful narrow suboperations can be revisited without declaring the whole package or redesigning its
purpose. This group is not a quality judgement.

### 6.5 Required validation record for any future claim

Record, per version and public leaf: actual resolved graph/conditional exports, exact npm-compatible
artifact, Worker-only type-check result, bundle result, runtime/tool version, compatibility date,
Node flags, imported Node APIs and actually invoked methods, meaningful output/error/cancellation
fixtures, timer/resource cleanup, bundle/startup/memory limits where material, and exclusions. Run a
standards lane and, where needed, a separate Node-compatible lane. Do not use a Deno test runner,
HappyDOM, browser bundle, or non-functional polyfill as a substitute for Worker behavior.

No concrete harness command is provided: there is no owning declared Workers task in this checkout,
and creating/installing one is outside the assessment authorization. A later validation task needs
explicit ownership and tool/dependency approval before execution.

## 7. Recommended maintenance passes

Ordered for small, evidence-driven work. Each pass is independent of a broad migration and is **not
implemented** by this audit.

| Pass                                               | Objective / affected packages                                                                  | Rationale and benefit                                                                                                  | Risks / dependencies                                                                                                     | Completion verification                                                                                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1 — Windowless predicate guard**                | `@sys/std/is` no-argument localhost and its public comment/tests                               | Smallest proven capability mismatch; useful shared predicate remains safe outside windows                              | Preserve browser/explicit-argument behavior; do not redefine `Is.browser`; baseline type-check blockers remain separate  | Windowless navigator fixture returns false without throwing; localhost/IPv6/browser cases unchanged; later actual Worker request proof                |
| **P2 — Restore trustworthy narrow test checking**  | Color/test assertion resolution; Crypto/Markdown/HTML test consumers                           | Current candidates cannot execute their ordinary checks, so fix the real baseline before adding misleading green tests | Root cause may be dependency/type resolution rather than runtime code; no opportunistic upgrade or blanket suppression   | Rerun the three exact §2.4 commands with checking enabled; identify and document actual cause; no `.to` casts or check bypass solely for green output |
| **P3 — Foundational candidate proof lane**         | Types/CRDT, Crypto hash/sign, parsing/schema/immutable/Event/selected std leaves               | A few representative leaves can establish repeatable standards-only artifact/runtime evidence                          | Explicit approval for harness/task/tooling; public types and external branches may reveal new blockers                   | Per-leaf Worker-only type check, resolved bundle, meaningful request output and lifecycle proofs; pin date/flags/versions and add records             |
| **P4 — Remove incidental host imports**            | CLI formatting, Crypto fmt, educational client; review similar common barrels                  | Eliminates broad eager host evaluation at its source rather than patching downstream symptoms                          | Screen still owns repaint; preserve terminal/authority semantics and public API; don't assume tree-shaking proof         | Fresh no-Deno imports and output/authority tests; assert resolved runtime closure excludes Process/FS on proposed portable leaves                     |
| **P5 — Public type boundary cleanup**              | Std address contracts/aggregate testing types; dependent HTTP/model/crypto types               | Removes Deno namespace requirements from structurally portable production contracts                                    | Public API/type compatibility and declaration generation; DOM type availability is separate                              | Independent Worker-only consumer without Deno ambient types; compile compatibility fixtures and exact generated artifact                              |
| **P6 — Narrow fetch/data candidate validation**    | HTTP client/byte responder, Registry client, Model memory/static, Model-Slug, `@tdb/data/slug` | Preserve existing adapters while establishing a useful edge data path                                                  | Browser Cache/ServiceWorker differences, range policy, request lifetime, deferred Net methods                            | Fake transport/fetch fixtures, GET/HEAD/errors/cancellation, memory watch cleanup; no host listeners/FS or live registry/service dependence           |
| **P7 — Security/capability decision, not shim**    | Std native/server disposal, FS Dist admission, R2 fromDist, ZIP                                | Makes the documented missing proxy primitive explicit; prevents unsafe portability work                                | Owner must choose supported capability or deliberately different contract; preserve traps/refusal/integrity guarantees   | Required native classifier behavior and adversarial cases in target runtime; fail closed when unavailable; independent security review                |
| **P8 — Optional heavy/WASM experiments**           | Automerge core/Repo; GPT tokenizer                                                             | Resolve conditional packaging/resource uncertainty only if actual edge demand exists                                   | WASM module asset branch, Repo cleanup/topology, CPU/startup/memory budget                                               | Workerd-specific first native use, synchronization/shutdown; bundle/resource measurements; explicit unsupported adapter list                          |
| **P9 — Evidence-led declaration/docs maintenance** | Package owners and JSR Settings for tested versions/scopes                                     | Align indicators with proven and documented operation scopes, including existing true settings                         | Package-wide badges can mislead; mixed exports need conservative wording; settings mutation needs separate authorization | Cross-check supported leaves/exclusions against proof record; update docs/metadata only after owner approval; no inference from metadata roots        |

Don't expand P1 into an environment-detection framework; don't expand P4 into rewriting host tools;
don't start P7 by weakening classifier/admission guarantees; don't add optional Durable Object,
binding, storage, or CRDT abstractions without a concrete required use case.

## 8. Open questions

1. What supported-entrypoint meaning do package owners intend for package-wide JSR runtime settings,
   especially the already-true Types, Crypto, and Data indicators?
2. Which exact versions/npm-compatible artifacts will a declaration cover, and do those complete
   graphs match the audited local configuration/source? Spot checks are not an artifact attestation.
3. What is the cause of the current TinyColor/assertion TypeScript failures under the frozen,
   manually-resolved existing install? They blocked execution; this report does not guess the fix.
4. Which production type barrels can compile with only Worker libraries, particularly Deno address
   names and browser DOM handler types? Which should retain explicit host/browser contracts instead?
5. Which selected Node export conditions do actual Worker tooling choose for YAML and other npm
   dependencies? Standards-only source compatibility can be lost in resolver selection.
6. Is there a genuine Worker requirement for trap-free proxy admission, and can the target platform
   supply it? If not, which security-sensitive surfaces should remain intentionally unsupported?
7. Is Worker R2 integration meant to use the current explicit signed-HTTP service or native
   bindings? The answer changes credential handling and adapter work; neither topology is
   implemented here.
8. Do useful HTTP/Registry/Data client methods need a narrower export, or do complete graph/runtime
   proofs establish that existing conditional browser/Net exposure is sufficient?
9. Can the wrapper's actual Automerge/Repo graph select the workerd WASM asset and quiesce correctly
   without host worker/listener/FS/IndexedDB operations? Upstream export support is only the start.
10. Are tokenizer bundle/startup/memory costs acceptable for an actual edge workload? No budget
    conclusion is supported yet.
11. What exact hosted/self-hosted `workerd`/`celld` capability and lifecycle contract is being
    targeted? Future product convergence must not retroactively turn current Deno tests into Workers
    evidence.
12. Which owner will define the first declared Worker validation task, including frozen dependency,
    artifact, tool, permission, compatibility-date, and no-remote-mutation policy?

## 9. Recommended first change

**One small maintenance change: guard `Is.localhost()`'s no-argument window/location dependency.**

- **Location:** `code/sys/std/src/m.Is/m.Is.ts:210–217`; associated contract comment in
  `code/sys/std/src/m.Is/t.ts:145–151` and cases in
  `code/sys/std/src/m.Is/-test/-u.browser.test.ts:20–45`.
- **Why this first:** source directly accepts navigator-only environments and then assumes window.
  The platform documents navigator support, so the capability mismatch is high-confidence and the
  fix is smaller/less invasive than changing dependency topology or security admission contracts.
- **Intended change:** in the no-argument branch, retain the current browser check, then inspect the
  actual location capability safely and return false when absent. Deliberately update the comment
  that currently requires a window-like global. Leave explicit URL/location arguments and the
  general meaning of `Is.browser()` unchanged. No global patch, Worker shim, detector registry, or
  dependency change.
- **Proof to add:** a fresh/isolated fixture with navigator/userAgent present, Deno absent, and no
  window/location; assert false without throwing. Also prove ordinary browser localhost and
  non-localhost, explicit localhost/IPv4/IPv6 URLs, and explicit location arguments remain
  unchanged. Restore any mocked global descriptors in teardown; no pollution of other tests.
- **Verification path:** after the unrelated baseline checking issue is understood, run the owning
  standard-library task against the narrow predicate tests with checking enabled, then execute
  `Is.localhost()` inside a real standards-only Worker request. The existing narrow browser test
  command is:

  ```sh
  cd /Users/phil/code/org.sys/sys/code/sys/std
  deno task test --cached-only --frozen --node-modules-dir=manual ./src/m.Is/-test/-u.browser.test.ts
  ```

  That command is a **future verification step, not an executed or passing result here**. No
  existing Worker task exists to name; defining one requires a later approved validation task.
- **Completion boundary:** the windowless call and existing behavior are proven. Other predicate
  operations, Deno public types, shared host barrels, Node native classifiers, and package-wide JSR
  metadata remain separate work. This first change alone must not trigger a compatibility
  declaration.

**Recommendation only. Nothing in this maintenance proposal has been implemented.**
