# pkg.help resource reader cleanup plan

## Context

The latest `@sys/tmpl pkg.help` output repeats a small embedded-resource reader stack in each generated package help module:

- lookup `json[path]`
- decode the data URI via `FileMap.Data.decode`
- assert decoded text
- parse YAML into a record
- require fields for package root help

This is currently operationally harmless, but it is duplicated glue rather than package-specific behavior.

## Scan result

Authoritative instances inspected:

- `code/-tmpl/-templates/tmpl.pkg.help/src/m.help/u/u.load.ts`
- `code/sys.tools/src/m.help/u/u.load.ts`
- `code/sys/cell/src/m.help/u/u.load.ts`
- `code/sys/server/src/m.help/u/u.load.ts`
- `code/-tmpl/src/m.help/u/u.dsl.ts`

Nearby reusable surface inspected:

- `code/sys/cli/src/m.core/m.Fmt.Chapters/m.Book.ts`
- `code/sys/cli/src/m.core/m.Fmt.Chapters/t.ts`

Finding:

- `Cli.Fmt.Chapters.Book` already generalizes chapter-tree parsing, field checks, and chapter link loading.
- It intentionally still requires the caller to provide a parsed-record reader.
- Each help package therefore repeats the resource lookup/decode/YAML-record adapter.
- The generated `pkg.help` template repeats the same adapter, so new generated packages will keep cloning it.

## Narrow refactor target

Introduce a shared embedded-help resource reader that owns only generic resource IO/parsing glue.

Candidate shape:

```ts
const Resource = Cli.Fmt.Chapters.Resources.create({
  json,
  label: 'ToolsHelp',
  parse: HelpYaml.record,
});

const data = Resource.readRecord(HelpResource.Root, ['summary', 'sections']);

const DslBook = Cli.Fmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'ToolsHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: Resource.readParsedRecord,
});
```

Alternative lower-level shape:

```ts
const Resource = Cli.Fmt.Resources.embeddedText({ json, label: 'ToolsHelp' });
const readParsedRecord = (path: t.StringPath) => HelpYaml.record(Resource.readText(path), path);
```

Prefer the first shape if it can live cleanly beside `Cli.Fmt.Chapters.Book`, because the duplicate callers are specifically help/chapter resources.

## Ownership boundary

This should not move package-specific YAML schema projection into `@sys/cli`.

Keep local/package-owned:

- `HelpYaml.string`, `HelpYaml.sections`, `HelpYaml.list`, `HelpYaml.pairs`, etc.
- Package-specific root help object shape.
- DSL/chapter authored YAML content.

Move/shared:

- embedded bundle map lookup
- data URI decode
- text assertion
- parsed-record reader adapter
- optional required-field wrapper
- consistent diagnostic prefixing

## Follow-up implementation order

1. Add the reusable reader in `@sys/cli` near the existing `Fmt.Chapters.Book` surface.
2. Add unit coverage for:
   - missing resource path
   - non-text decoded resource
   - YAML parse/record adapter passthrough
   - required-field failure
3. Update `code/-tmpl/-templates/tmpl.pkg.help/src/m.help/u/u.load.ts` to generate the shared-reader usage.
4. After the shared reader exists, do a follow-on cleanup pass across the current package users:
   - `@sys/tmpl`: `code/-tmpl/src/m.help/u/u.dsl.ts`
   - `@sys/cell`: `code/sys/cell/src/m.help/u/u.load.ts`
   - `@sys/tools`: `code/sys.tools/src/m.help/u/u.load.ts`
   - `@sys/server`: `code/sys/server/src/m.help/u/u.load.ts`
5. Remove the local duplicated `readText` / `readParsedRecord` / `readRecord` helper stacks from those packages during that pass.
6. Run focused checks/tests for `@sys/cli`, `@sys/tmpl`, `@sys/cell`, `@sys/tools`, and any other migrated help package.

## Non-goals

- Do not refactor unrelated `/** Helpers: */` blocks.
- Do not change DSL wording/content.
- Do not add per-tool chapters.
- Do not mix this into the current `@sys/tools` initial DSL-help landing commit.
