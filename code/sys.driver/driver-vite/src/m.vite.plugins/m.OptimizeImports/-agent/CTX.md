# OptimizeImports plugin context

## Current state
The optimize-imports work is past stub stage, but the authority model was recently corrected.

Implemented and proven so far:
- plugin area established under `src/m.vite.plugins/`
- `m.OptimizeImports` module established with canonical common/type/runtime split
- kernel rewrite logic implemented
- plugin wrapper implemented
- plugin wired into `Vite.Config.app(...)`
- targeted kernel tests passing
- config integration tests passing
- proof added against the published UI sample entry source through the app-config-composed plugin
- hard-coded default rules were reviewed against real public exports
- invalid default rule drift was caught and tightened

This means the current state is:
- kernel complete
- app-config wiring complete
- config-wired sample proof complete
- rule-authority model clarified
- not yet final feature-complete

## Important design decisions already locked
- the long-term target is a derived barrel optimizer, not a hand-authored package knowledge table inside `driver-vite`
- public subpaths only
- graph is not sole rewrite authority
- `deno.graph.json` alone is not enough; derivation also needs package `deno.json` exports plus root/public subpath export analysis
- current hard-coded rules are acceptable only as a mechanism spike/proof, not the final authority model
- regex implementation is acceptable for the current narrow scope while proving mechanism
- future AST/parser upgrade remains possible without public API scar tissue

## What is currently implemented
### Current default spike rule
- package: `@sys/ui-react-devharness`
- rewrites:
  - `useKeyboard` -> `./hooks`

Notes:
- `useRubberband` was removed from defaults after verifying that `./hooks` does not publicly export it
- `@sys/ui-react-components` does not yet expose narrow enough public subpaths for common root symbols like `Button`/`Icon`

### Internal module shape
- `mod.ts`
- `mod.OptimizeImportsPlugin.ts`
- `u.rewrite.ts`
- `u.rules.ts`
- `t.ts`
- `common.ts`
- `-test/`

## What is currently tested
### Kernel rewrite behavior
Covered:
- approved named import rewrite
- grouping multiple approved imports to same target
- preserving unknown imports on the broad package root
- leaving unknown imports unchanged
- alias preservation
- default imports unchanged
- namespace imports unchanged
- type-only import unchanged when only value rule exists
- mixed type/value rewrite behavior
- positive whole-declaration `import type` rewrite for `kind: 'type'`
- positive whole-declaration `import type` rewrite for `kind: 'both'`
- multiline formatted import declarations

### Plugin behavior
Covered:
- plugin API surface
- plugin name
- `enforce: 'pre'`
- transform rewrites target source
- transform ignores unsupported files / untouched code / `node_modules`

### Config integration
Covered:
- optimize-imports included in `ViteConfig.app(...)`
- optimize-imports appears before caller `vitePlugins`
- app-config-composed plugin rewrites the published UI sample entry source from:
  - `@sys/ui-react-devharness`
  to:
  - `@sys/ui-react-devharness/hooks`

### Rule-validation coverage
Covered:
- default rules target real public `deno.json` exported subpaths
- target modules actually export the approved symbols

## What was attempted and intentionally not kept as the proof path
A broader external build/dev proof attempt was started and then backed out for this phase.

Reason:
- failures were dominated by unrelated substrate/toolchain noise
- that path did not isolate the optimize-imports claim cleanly

Current judgment:
- the cleaner S-tier proof for now is the app-config-composed published-sample source assertion
- broader external runtime/build proof can come later if needed

## Recommended next phase
1. define the derived rule dataset shape
   - package `deno.json` exports
   - root barrel exports
   - public subpath exports
2. implement rule derivation for safe unambiguous symbol → public subpath candidates
3. keep graph input only for prioritization/proof, not sole authority
4. document blocked upstream public subpath export gaps
5. later expand proof once derivation is in place

## Candidate next commit lanes
- `design(driver-vite): derive optimize-imports rules from public barrel exports`
- `docs(driver-vite): record blocked upstream public subpath exports`

## Notes for resume
- keep the plugin mechanism; change the rule-authority source
- do not entrench hand-authored package-specific `@sys/*` knowledge in `driver-vite`
- derive from public package/export/barrel reality
- use graph only as supporting input for payoff/prioritization/proof
- do not add raw graph structures to the public plugin API
- keep regex implementation only while the scope remains narrow and controlled
- if syntax scope expands materially, consider replacing internals with a parser/AST path without changing public API
