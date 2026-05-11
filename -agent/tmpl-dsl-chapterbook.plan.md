# @sys/tmpl DSL chapter-book plan

## BMIND essence

Make `@sys/tmpl` agent-operable from speech-act prompts by giving agents a small, navigable DSL help surface: root usage guidance plus one chapter per system template.

The move is good only if the DSL stays operational:

- classify prompt → choose template
- identify slots → ask when missing
- invoke exact command → do not improvise subpaths
- state side effects → know what setup mutates
- verify scaffold → inspect/check the landed boundary

Do not turn this into broad documentation or a second template spec.

## S-tier reality anchor

`@sys/cell` already proves the shape:

- authored YAML chapters
- bundled help resources
- `dsl [chapter...] [--format human|skill]`
- `Cli.Fmt.Chapters` rendering
- tests pinning chapter routing and skill projection

The only reusable gap is the package-local chapter loader. Extract that first, then make `@sys/cell` the regression oracle before applying the pattern to `@sys/tmpl`.

## Commit sequence

1. `feat(cli): add reusable chapter book loader`
   - Extract only generic chapter-book loading: resource tree, path resolution, YAML record validation, sections, chapter links.
   - Do not extract Cell-specific command strings, content, or skill metadata.

2. `refactor(cell): use shared chapter book for DSL help`
   - Migrate Cell DSL loading to the shared loader.
   - Keep rendered behavior stable except for deliberate test-reviewed differences.

3. `feat(tmpl): add templater DSL help content`
   - Add root “how to use the templater” chapter.
   - Add chapters for `repo`, `pkg`, `m.mod`, `m.mod.ui`, and `m.mod.ui.controller`.
   - Include speech acts, slots, exact commands, side effects, stop/ask rules, and verification.

4. `feat(tmpl): expose dsl help command`
   - Add `@sys/tmpl dsl [chapter...] [--format human|skill]`.
   - Keep template execution through the index command: `deno run -A jsr:@sys/tmpl <template> ...`.
   - Treat `@sys/tmpl-engine` as substrate guidance, not the normal operator path.

5. `test(tmpl): pin templater DSL help behavior`
   - Test root DSL, each template chapter, skill projection, unknown chapter, and bad format handling.
   - Keep tests focused on agent-operable contract output, not private implementation details.

## Guardrails

- Ask for missing slots; do not infer names, targets, or component names from vibes.
- Do not recommend `jsr:@sys/tmpl/<template>` subpaths.
- Do not use `@sys/tmpl-engine` for normal system-template operation.
- Do not hand-copy template files when the CLI can scaffold them.
- Keep the shared loader small; no general help framework.
- When rendered chapter examples include YAML, use `Cli.Fmt.Code.highlight(..., { lang: 'yaml' })` before terminal rendering; do not hand-color YAML blocks.

## Final reality

Done. The original arc landed and the plan is now historical truth, not active work.

Completed implementation sequence:

1. `feat(cli): add reusable chapter book loader`
2. `refactor(cell): use shared chapter book for DSL help`
3. `feat(tmpl): add templater DSL help content`
4. `feat(tmpl): expose dsl help command`
5. `docs(tmpl/help): surface DSL as preflight in root help`
6. `test(tmpl): pin templater DSL help behavior`

Current operator contract:

- `@sys/tmpl dsl [chapter...] [--format human|skill]` is a reserved command, not a template.
- Root `@sys/tmpl --help` now points agents to `dsl` first, leads examples with `dsl`, and includes a compact prompt → template mapping.
- Templater DSL chapters cover `repo`, `pkg`, `m.mod`, `m.mod.ui`, and `m.mod.ui.controller` with speech acts, slots, commands, side effects, and verification.
- Skill projection is available with `--format skill` and uses deterministic chapter-derived skill names.
- Entry tests pin root-help preflight behavior.
- DSL tests pin root chapter routing, child chapter routing, skill output, explicit human output, bad format handling, repeated/missing format handling, scaffold-flag rejection, and unknown chapter failure.

Deliberate follow-ups, not part of this completed arc:

- Add DSL hints on required-slot parse failures.
- Add a drift test for DSL slot names vs CLI flags.
- Decide separately whether `@sys/cell --help` should receive a Cell-native DSL preflight pass.
- Wire canon guidance so workspace agents consult `@sys/tmpl dsl` before scaffolding.

## Confidence

High. The extraction stayed narrow, `@sys/cell` served as the regression oracle, and `@sys/tmpl` now has both discoverable DSL help and contract tests for the agent-facing command seam.
