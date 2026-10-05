@sys.html
html-capability.plan.md
- [ ] GATE Human approves the HTML capability design in the actual /sys context
- [ ] chore(html): scaffold the HTML package
- [ ] feat(html): expose HTML parsing contracts and migrate Vite consumers

## Purpose and boundary

Extract the smallest coherent universal HTML capability justified by current /sys usage.
`@sys/html` exporting `Html` is the proposed owner, not yet an approved package or API.
First deliver repository discovery, a type-first proposal, and a TMIND design review;
stop for the human's DMIND lock before scaffolding or implementation.

## Current-use coverage requirement

- Inventory all first-party parse5 usage across /sys, including runtime code, tests,
  type imports, aliases, dependency declarations, and any additional consumers found.
- Map every consumed operation, option, node/type, diagnostic, and location field to
  the proposed public contract. Record each call site's intended migration and proof.
- Cover those needs generally and elegantly in @sys/html rather than exporting Vite-shaped
  helpers or mechanically mirroring all of parse5. Any coverage gap needs an explicit decision.
- Migrate current first-party consumer call sites, including tests, to the public Html
  library and its isolated ./t surface. Keep direct parse5 coupling inside the owning
  HTML package; any exception must be justified and agreed, not left as migration residue.
- Dependency metadata and lockfile references are not consumer call sites. Third-party
  dependencies' internal parse5 usage is not code we migrate.
- Finish with a repository search and file-by-file residue review to establish that no
  first-party consumer bypasses the agreed boundary.

## Initial inspected evidence

A repository text search found two direct first-party import sites. Both files have been
opened; this is an initial inventory, not completed discovery or runtime verification.
Paths below are relative to the workspace root.

| Consumer | Existing need | Proposed migration obligation |
| --- | --- | --- |
| `code/sys.driver/driver-vite/src/m.vite.plugins/m.HtmlIntegrity/u.html.ts` | `parse`, default-tree element guard and template content access; Element, ParentNode and Template types; child nodes, namespaces, tag names, decoded attributes; sourceCodeLocationInfo, scriptingEnabled, onParseError; duplicate-attribute diagnostics and original attribute offsets | Use the HTML public runtime/type surfaces while preserving traversal, errors, policy and MagicString insertions |
| `code/sys.driver/driver-vite/src/m.vite.plugins/m.HtmlIntegrity/-test/-u.htmlIntegrity.test.ts` | `parseFragment` and element narrowing to reparse emitted HTML and verify effective attributes and idempotence | Exercise the same contract through Html without weakening existing assertions |

`deps.yaml` declares parse5 8.0.1 in its Deno and package.json dependency sections with
`dev: true`. Reassess dependency ownership for a universal runtime package; change canonical
metadata and regenerate through the owning task rather than hand-editing generated imports.

The inspected consumer uses parser interpretation and offsets plus MagicString edits.
Parsing/serialization alone is not a source-preservation contract. Existing tests include
entity-encoded URLs, quoted/unquoted attributes, inert templates, scripting-sensitive
noscript content, foreign namespaces/integration points, and duplicate-attribute refusal.
Tests were inspected, not run in this planning pass.

## Discovery and design proposal

1. Complete the consumer inventory and read the surrounding Vite implementation and tests.
2. Inspect Markdown/YAML package boundaries, exports, type spines, templates, and relevant
   published JSR surfaces. Inspect the actual parse5 version's sources and public contracts.
3. Propose the minimum TypeScript contract with an explicit usage-to-API coverage map.
   Resolve document versus fragment semantics, context overloads, tree adapter options,
   templates, namespaces, parser recovery, diagnostics, and optional source locations.
4. Prefer direct upstream types where truthful; introduce an @sys abstraction only for
   concrete value. Resolve tree mutability/readonly contracts without pretending to freeze
   upstream objects. Justify every runtime export and any subpath beyond ./t.
5. Include one browser hello world. Distinguish intended compatibility from demonstrated
   compatibility; inspect runtime imports and propose measured browser bundle proof.
6. Apply TMIND from API-consumer, parsing/source-correctness, and runtime/dependency viewpoints.
   Return findings, proposals, verified results, tradeoffs, and unresolved decisions separately.

Document parsing, fragment parsing, and element narrowing have concrete callers. Exact names
and shapes remain open. Serialization, generalized traversal, and other convenience helpers
must earn inclusion; earlier sketches are not API commitments.

## Consumer-owned decisions and non-goals

Keep resource coverage, Vite input/output behavior, integrity and credential policy, URL
ownership, refusal policy, and source-editing strategy in the Vite consumer. Do not move
MagicString, build tooling, or Node-only stream dependencies into the universal entry.
Do not create an HTML framework or promise an unmeasured tiny browser bundle.

## Design approval dependency

Authority: the human, under the requested DMIND design lock in /sys. This decision controls
both local implementation items. Pass condition: explicit approval of ownership, the public
contract, consumer coverage/migration, and verification scope, recorded here with its evidence.
If rejected or unresolved, revise the proposal and do not scaffold or implement. Review activity
alone does not satisfy this decision. Planning grants no Git-mutation authority.

## Bounded implementation and verification after approval

- Inspect the owning tasks and template, then human-led scaffold and structure review.
  Confirm the actual landing before implementation; write the type spine before runtime code.
- Fulfill the approved contract, add owner-level behavior/type tests, and migrate all inventoried
  consumers in the bounded extraction. Preserve the parser version and existing consumer behavior
  unless a separate change is explicitly agreed.
- Prove documents/fragments, decoded attributes, templates/namespaces, recovery diagnostics,
  source offsets and absent locations at the owner. Verify earned options/overloads and type-only
  isolation. Preserve Vite policy and byte-preserving output assertions at the consumer.
- Use the inspected module tasks for narrow checks/tests, then the agreed integration coverage.
  Run a real browser hello world and server-runtime proof; inspect the shipped import graph and
  measure a reproducible browser build with tool/version, entry, minification and compression noted.
- Review every changed file for stale imports/types, dependency leakage, weakened assertions,
  speculative exports, scaffolding residue, and inaccurate documentation before calling it complete.
