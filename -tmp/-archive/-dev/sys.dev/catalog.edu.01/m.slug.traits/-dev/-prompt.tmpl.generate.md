Run it like:

     Generate full schema integration for new trait:
          `schema.trait-name.ts`
          (trait id: `trait-name`)

============================================================================

You are to add a new trait schema module under:

  src/catalog.edu/m.slug.traits/traits.schema/

If no filename is given, ask me first:
  → "Please provide the filename, e.g. schema.<trait-name>.ts,
     where <trait-name> is also the trait registry id
     (used in SlugTraitBindingOf<'trait-name'>)."

Once the filename is known, perform the following steps:

1) Generate the schema file itself (TypeBox syntax), following the house style:
   - Internal schema constant: <TraitPascal>PropsSchemaInternal
   - Public export: <TraitPascal>PropsSchema (t.TSchema)
   - Include $id: 'trait.<trait-kebab>.props'
   - Include title and additionalProperties: false

2) Generate integration changes (use // markers for surgical edits):
   - Export from `mod.ts`
   - Import + expose from `m.Traits.ts`
   - Add type guard in `m.Is.ts`
   - Extend `SlugTraitsLib` in `t.ts`
   - Extend `SlugTraitIsLib` in `t.flags.ts`
   - Add explicit type alias to `t.type-gen.ts`
   - Add registry entry in DefaultTraitRegistry (if exists)
   - Add id in TRAIT_IDS constant (if exists)

3) Generate schema validation tests:
   - File: -schema.<trait-name>.test.ts
   - Validate valid/invalid values using `Value.Check`
   - Match existing test style (e.g., -schema.concept-layout.test.ts)

4) Generate `Is` predicate tests:
   - In the same file where other Is tests live (e.g., -Is.test.ts)
   - Cover:
       • signature check with `expectTypeOf`
       • runtime truth table
       • narrowing test with inline `if (Is.<TraitCamel>Props(...))`

============================================================================

Placeholders
- <trait-kebab>: kebab-case trait id, e.g. file-list
- <TraitPascal>: PascalCase, e.g. FileList
- <TraitCamel>: camelCase, e.g. fileList
- <TraitTitle>: Human title, e.g. File List

Invariants
- $id is stable and unique per trait: "trait.<trait-kebab>.props". Changing this is breaking.
- additionalProperties: false is always set on trait prop schemas.
- Public exported types are type aliases only; never use interfaces in public API.
- Imports and getters inside Traits.Schema are alphabetical unless dependency ordering is required.
- String fields policy: decide once per repo and be consistent
  - Option A: allow empty (omit minLength).
  - Option B: enforce non-empty (minLength: 1).
  Document the policy in the schema JSDoc comment.

============================================================================

Schema file template

```ts
// file: src/catalog.edu/m.slug.traits/traits.schema/schema.<trait-kebab>.ts
import { type t, Pattern, Type as T } from './common.ts';

/**
 * Properties: <TraitTitle>.
 * Minimal common shape: id?, name?, description?
 */
export const <TraitPascal>PropsSchemaInternal = T.Object(
  {
    id: T.Optional(
      T.String({ title: 'Formal identifier of the <trait-kebab>.', ...Pattern.Id() }),
    ),
    // If non-empty labels are required, add { minLength: 1 } to the following fields.
    name: T.Optional(T.String({ description: 'Display name for the <trait-kebab>.' })),
    description: T.Optional(T.String({ description: 'Description of the <trait-kebab>.' })),

    // Add trait-specific fields below (optional/required as needed).
  },
  {
    $id: 'trait.<trait-kebab>.props',
    title: '<TraitTitle> Properties',
    additionalProperties: false,
  },
);

/** Public widened export (JSR-safe explicit t.TSchema). */
export const <TraitPascal>PropsSchema: t.TSchema = <TraitPascal>PropsSchemaInternal;
```

All code should use the system repo's conventions:
  - TypeBox schema (no inferred types)
  - ASCII quotes only, on emdash
  - Use `// 🌸 ---------- ACTION ----------` markers for edits
  - Ensure optional props use `T.Optional`
  - Ensure `additionalProperties: false`
  - Use TypeBox pattern helpers from @sys/schema/recipe `Pattern` if appropriate

When you respond:
  - Write out all modified and new files fully.
  - Include concise explanations for each step.

============================================================================
