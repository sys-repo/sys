🫵 Run it like:

     Generate full schema integration for new trait:
          `schema.time-map.ts`
          (trait id: `time-map`)

============================================================================

You are to add a new trait schema module under:

  src/catalog.edu/m.slug.traits/traits.schema/

If no filename is given, ask me first:
  → "Please provide the filename, e.g. schema.<trait-name>.ts,
     where <trait-name> is also the trait registry id
     (used in SlugTraitBindingOf<'trait-name'>)."

Once the filename is known, perform the following steps:

1. Generate the schema file itself (TypeBox syntax),
   following the house style:
     - Internal schema constant: <PascalCase>PropsSchemaInternal
     - Public export: <PascalCase>PropsSchema (t.TSchema)
     - Include $id: 'trait.<kebab>.props'
     - Include title and additionalProperties: false

2. Generate integration changes (with // 🌸 markers):
     - Export from `mod.ts`
     - Import + expose from `m.Traits.ts`
     - Add type guard in `m.Is.ts`
     - Extend `SlugTraitsLib` in `t.ts`
     - Extend `SlugTraitIsLib` in `t.flags.ts`
     - Add explicit type alias to `t.type-gen.ts`
     - Add registry entry in DefaultTraitRegistry (if exists)
     - Add id in TRAIT_IDS constant

3. Generate schema validation tests:
     - File: -schema.<trait-name>.test.ts
     - Validate valid/invalid values using `Value.Check`
     - Match existing test style (e.g., -schema.concept-layout.test.ts)

4. Generate `Is` predicate tests:
     - In the same file where other Is tests live (e.g., -Is.test.ts)
     - Cover:
         • signature check with `expectTypeOf`
         • runtime truth table
         • narrowing test with inline `if (Is.<traitName>Props(...))`

All code should use the repo’s conventions:
  - TypeBox schema (no inferred types)
  - `readonly` props and arrays
  - ASCII quotes only
  - Use `// 🌸 ---------- ACTION ----------` markers for edits
  - Ensure optional props use `T.Optional`
  - Ensure `additionalProperties: false`
  - Use TypeBox pattern helpers from `Pattern` if appropriate

When you respond:
  - Write out all modified and new files fully.
  - Include concise explanations for each step.

============================================================================
