# Cell DSL operational examples plan

Status: complete; implementation, README retirement follow-up, validation, and commits are done. Posture: BMIND + TMIND + STIER.

## Origin

This came from a real agent failure mode: an agent was asked, in ordinary prompt language, to add a
Cell service/pull-like thing and made an invalid Cell edit. When shown the README examples, it was
clear those examples would have helped the agent recognize the intended slots and avoid guessing.

The bug is therefore not primarily documentation duplication. The bug is that the mandatory public
agent path did not expose enough slot-recognition examples for natural-language Cell edit prompts.

## First-principles problem

A Cell edit should move through public contracts, not through source spelunking or guessed YAML:

```text
natural-language prompt
→ classify speech act
→ read root DSL
→ read matching operation chapter
→ recognize/confirm slots
→ use owner help/API
→ update only Cell composition fields
```

The missing rung is `recognize/confirm slots`.

The root DSL and operation chapters already state doctrine and owner boundaries. They do not yet give
enough concrete examples for prompts like:

```text
add a service to the cell that pulls from fs.db.team
```

That phrase is not a complete descriptor patch. It might point toward a dist bundle URL shape, a
pulled view operation, owner pull config, static serving, proxy routing, or a service endpoint. The
agent needs examples that make it stop, classify, and ask/confirm instead of inventing descriptor
internals.

## Current descriptor vocabulary

Use only the current descriptor model:

```yaml
services:
  - name:
    use:
    from:
    config:

tasks:
  - name:
    use:
    from:
    config:
```

Do not reintroduce older or false shapes:

- no `runtime.services[]`
- no endpoint `export` field
- no service `kind`
- no Cell-owned `views[]`
- no Cell-owned view registry
- no pull/proxy/static-serving mechanics inside `cell.yaml`

## Design decision

Move operational examples into the DSL docs, not README.

README should stay tight around:

- what Cell is
- why the folder-shaped medium exists
- conceptual model
- minimal usage
- pointer to `@sys/cell dsl`

DSL docs should own:

- speech acts
- mappings
- slot-recognition examples
- descriptor patch shapes
- owner boundaries
- service/task operational guidance

This means we are **not blocked by Markdown or README bundling**. There is no need to bundle root
`README.md`, no need to parse Markdown, and no need for prep-time README extraction for this feature.
The correct source of truth for operational examples is the DSL YAML chapter itself.

## TMIND alternatives reviewed

1. Keep examples in README and sync README → YAML during prep.
   - Technically viable, but now rejected for this slice. It makes README the source of operational
     protocol examples when the better boundary is DSL-as-operational-ontology.

2. Bundle root `README.md` directly as another chapter.
   - Rejected. Current help bundle root is `src/m.help`; package-root README inclusion would require
     bundle re-rooting, a second bundle, or Markdown extraction plumbing. None is needed once README
     stops owning these operational examples.

3. Add a `dsl readme` chapter.
   - Rejected. The agent failure was not a need to read README; it was a need for slot-recognition
     examples inside the DSL path.

4. Add examples directly to root `dsl.yaml`.
   - Rejected. Root DSL should stay a router/doctrine surface. Branded examples would add noise to
     every DSL read and blur examples with grammar.

5. Add examples into each operation chapter.
   - Rejected for first implementation. It spreads branded sample-domain values into otherwise
     generic operation docs.

6. Add `dsl examples` as a normal YAML chapter.
   - Accepted. This uses the existing YAML → FileMap → `Cli.Fmt.Chapters` path and keeps examples
     opt-in when a prompt is ambiguous.

## Implementation target

Add one child chapter:

```sh
deno run -ER jsr:@sys/cell dsl examples
deno run -ER jsr:@sys/cell dsl examples --format skill
```

Backed by:

```text
src/m.help/yaml/dsl.examples.yaml
```

Registered in:

```text
src/m.help/u/u.paths.ts
```

Bundled by the existing task/path:

```text
src/m.help/-bundle/mod.ts
HelpResource.Source.Files
```

Rendered by the existing runtime path:

```text
CellHelp.Dsl.load
→ Cli.Fmt.Chapters.Book
→ FmtDslHelp.output
→ human/skill output
```

## Chapter purpose

`dsl examples` is not grammar and not defaults. It is a recognition aid.

It should tell agents:

- use this after the speech act is recognized but slots are incomplete or informal
- sample values are examples, not required values
- `fs.db.team` is likely a dist bundle URL clue, not a complete config
- ask for or confirm the full `.../dist.json` URL when missing
- route to matching operation chapters and owner help before editing
- do not inspect package source merely to infer these examples

## Suggested chapter sections

1. `Rule`
   - Use only when a prompt resembles a Cell DSL speech act but slots are incomplete or informal.
   - Examples are sample slot values, not DSL grammar or defaults.
   - Confirm missing slots before editing.

2. `Common prompt shapes`
   - `fs.db.team` likely points to an HTTP dist bundle URL slot.
   - Ask for or confirm a complete `https://.../dist.json` URL.
   - Depending on wording, likely operations are `add: pulled view` or `refresh: pulled views`.
   - Do not put dist URL/local target mechanics in `cell.yaml`.

3. `Sample slot values`
   - `<dist-url>`: `https://fs.db.team/driver.stripe/dist.json`
   - `<dist-url>`: `https://fs.db.team/ui.components/dist.json`
   - `<service-name>`: `ui:static:views`
   - `<service-name>`: `stripe:dev:fixture`
   - `<service-name>`: `cell:proxy`
   - `<module>` / `<endpoint>`: `jsr:@sys/driver-stripe/server/fixture` / `StripeFixture`
   - `<config>`: `./-config/@sys.driver-stripe/fixture.yaml`
   - `<view>`: `stripe.dev`, `hello`

4. `Descriptor shapes`
   - Show only the current generic shape:

     ```yaml
     services:
       - name:
         use:
         from:
         config:

     tasks:
       - name:
         use:
         from:
         config:
     ```

   - State that owner config internals stay outside `cell.yaml`.

5. `Owner flow reminders`
   - Pulled view config is owned by `@sys/tools/pull`.
   - Static serving is owned by `@sys/tools/serve`.
   - Proxy routing is owned by `@sys/http/server/proxy`.
   - Cell records only services, tasks, endpoint refs, and owner config refs.

6. `Source-reading guardrail`
   - Prefer root DSL, matching chapter, examples, and owner `--help` before source.
   - Source inspection is last resort for public exports, types, or lifecycle/task contracts only.

## Root DSL updates

Update `src/m.help/yaml/dsl.yaml` only as routing guidance:

- Agent reading protocol: after reading matching operation chapter(s), read `dsl examples` if slot
  interpretation remains unclear.
- Owners: before package source inspection, read `dsl examples` when examples may resolve slot
  interpretation.
- Mappings: if a prompt mentions `fs.db.team`, treat it as likely dist bundle URL shape and read
  `dsl examples` before guessing.

Keep root concise. Do not paste sample values into root.

## README adjustment

Completed separately after the DSL examples slice.

The README no longer carries a dedicated `## Service modes` operational recipe or service-mode DSL pointer. This is intentional:

- README stays conceptual and orienting.
- The CLI usage block still shows the shape of `start . --mode dev`.
- Operational service-mode doctrine lives in DSL help.
- Concrete descriptor/config shape is owned by DSL chapters and samples, not README prose.
- No README Markdown is bundled, parsed, or treated as an operational source of truth.

## Implementation steps

1. Add `src/m.help/yaml/dsl.examples.yaml`.
2. Register `chapter('examples', 'yaml/dsl.examples.yaml')` in `HelpResource.Dsl.Root.children`.
3. Update root DSL routing text in `src/m.help/yaml/dsl.yaml`.
4. Update tests:
   - root chapter index includes `examples`
   - `CellHelp.Dsl.load(['examples'])` loads expected sections
   - `dsl examples` routes to the examples chapter
   - `dsl examples --format skill` emits `name: "sys-cell-dsl-examples"`
   - rendered examples contain `fs.db.team`
   - rendered examples contain `jsr:@sys/driver-stripe/server/fixture` and `StripeFixture`
   - rendered examples contain `services:` and `tasks:` generic shapes
   - generic operation chapters remain free of Stripe/branded examples
5. Rebuild the existing help bundle:

   ```sh
   cd /Users/phil/code/org.sys/sys/code/sys/cell
   deno task help:bundle
   ```

6. Validate through package tasks:

   ```sh
   cd /Users/phil/code/org.sys/sys/code/sys/cell
   deno task check
   deno task test
   deno task dry
   ```

## STIER constraints

- No new runtime API.
- No new CLI flag.
- No Markdown parser.
- No README bundling.
- No package-root bundle re-rooting.
- No changed `Cli.Fmt.Chapters` behavior.
- No changed Cell descriptor schema.
- No owner config schema duplication.
- No examples that look like defaults.
- No old descriptor vocabulary.

## Acceptance criteria

- `@sys/cell dsl --format skill` lists the `examples` chapter.
- `@sys/cell dsl examples --format skill` is concise and operational.
- The examples chapter directly addresses the real failure mode: informal prompt terms such as
  `fs.db.team` must lead to slot confirmation, not guessed descriptor edits.
- The examples chapter reflects current descriptor vocabulary: `services[]`, `tasks[]`, `use`,
  `from`, `config`.
- Agents are told to prefer DSL/examples/owner help before package source.
- README is no longer required as an operational examples source.

## Commit ledger

Primary implementation commit:

```text
320dc2e19 docs(cell): surface operational examples in DSL help
```

Associated README-retirement follow-up:

```text
701f91a20 docs(cell): remove service mode recipe from README
```

Plan truth update commit:

```text
plan(cell): record DSL operational examples completion
```
