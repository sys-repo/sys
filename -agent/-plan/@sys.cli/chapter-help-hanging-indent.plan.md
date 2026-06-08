# @sys/cli chapter help hanging-indent plan

## Commit messages

- [x] `style(cli): add hanging indents to chapter section wraps`
- [x] `docs(help): normalize DSL YAML logical help items`

## Goal

Make terminal chapter help easier to scan without encoding presentation spacing in YAML.

The renderer should distinguish:

- a new logical point, authored as a separate `section.items[]` item
- a continuation of the same logical point, produced by soft wrapping or an explicit same-item line break
- atomic command/code/reference lines that must not be semantically split

## Canonical rendering rule

For terminal chapter sections:

```text
Mappings   new logical point starts here
           long logical point wraps here
             continuation line is +2
           next logical point starts here
```

Rules:

1. New logical item starts at the normal body column.
2. Continuation lines inside the same item render at body column + 2.
3. Atomic command/code/reference lines remain intact when wrapping would change meaning.
4. YAML does not carry output-alignment spaces.
5. The renderer does not add bullets/arrows/ornament.

## Pass 1 — tighten `@sys/cli`

Implement and pin the shared formatter behavior first.

Target files:

- `code/sys/cli/src/m.core/m.Fmt.Chapters/m.Chapters.ts`
- `code/sys/cli/src/m.core/m.Fmt.Chapters/-test/-.test.ts`

Acceptance tests:

- [x] soft-wrapped section item continuation lines render with +2 hanging indent
- [x] separate `section.items[]` entries remain peer lines, not continuations
- [x] explicit same-item line breaks render as continuations with +2 hanging indent
- [x] fenced code blocks preserve authored lines
- [x] atomic command/code/reference lines are not split when wrapping would change meaning
- [x] existing chapter command summary indentation remains intact
- [x] Markdown projection wraps section prose at the Markdown width

Verification:

- [x] `cd code/sys/cli && deno task test --trace-leaks ./src/m.core/m.Fmt.Chapters`
- [x] `cd code/sys/cli && deno task check`
- [x] runtime-probe a representative DSL page, e.g. `cd code/sys/cell && deno task cli dsl`

## Pass 2 — audit DSL YAML usage sites

After the renderer is canonical, audit authored DSL YAML for places where visual wrapping was encoded as semantic lines.

Canonical YAML authoring rules:

```yaml
items:
  - short logical point
  - >-
    long prose point may wrap in YAML but remains one logical item
  - |-
    prose introducing an atomic command:
    `deno run ...`
```

Reserve this form only for true one-line peer lists:

```yaml
items: |
  point one
  point two
```

Likely scan target:

- `code/**/src/m.help/yaml/dsl*.yaml`

Audit questions:

- [x] Is each line a distinct logical point?
- [x] Is a wrapped prose continuation currently being loaded as a separate point?
- [x] Should a block scalar become a list of explicit items?
- [x] Should a long prose item use folded or literal YAML to avoid semantic hard breaks?
- [x] Are command/code/reference lines still atomic?

Expected affected follow-up files may include DSL YAML and generated bundles under:

- `code/-tmpl/src/m.help/`
- `code/sys.tools/src/m.help/`
- `code/sys/cell/src/m.help/`
- `code/sys/server/src/m.help/`
- `code/sys/workspace/src/m.help/`

Verification after YAML pass:

- [x] regenerate affected help bundles
- [x] run affected help/DSL tests
- [x] run affected package checks
- [x] scan for stale semantic command splits or risky inline-code breaks

## BMIND risk notes

- Do not attempt to infer all YAML semantics from rendered line shape. Some `items: |` blocks may intentionally be peer lists.
- Do not fix YAML before the renderer behavior is pinned; otherwise visual diffs become ambiguous.
- Do not add output indentation into YAML as presentation spaces.
- Do not over-indent; +2 is the canonical minimum intentional hierarchy signal.
