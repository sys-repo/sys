import { type t, Is, Obj, Schema, Slug, SlugSchema, Value, Yaml } from './common.ts';
import { Error } from './m.Slug.Error.ts';
import { SlugRules } from './u.slug.rules.ts';

type E = t.DeepMutable<t.SlugYamlErrors>;

/**
 * Narrow a domain-like object to one that exposes an optional Registry with a `has(id)` function.
 * (No `any`; runtime guards only.)
 */
type HasFn = (id: string) => boolean;
type MaybeRegistry = { has: HasFn };
type DomainWithRegistry = { Registry: MaybeRegistry };

export const fromYaml: t.SlugFromYaml = (yamlInput, pathInput) => {
  const ast: t.Yaml.Ast = Is.string(yamlInput) ? Yaml.parseAst(yamlInput) : yamlInput;
  const path: t.ObjectPath = Array.isArray(pathInput)
    ? pathInput
    : Obj.Path.decode(pathInput ?? '');

  // Extract candidate from plain JS value (not AST nodes):
  const root = ast.toJS?.();
  const candidate = Obj.Path.get(root, path);

  // Errors:
  const errs: E = { schema: [], semantic: [], yaml: [] };
  if (Array.isArray(ast.errors) && ast.errors.length > 0) {
    errs.yaml.push(...Schema.Error.fromYaml(ast.errors));
  }
  const zero = (arr: ArrayLike<unknown>) => arr.length === 0;
  const isOk = () => zero(errs.schema) && zero(errs.semantic) && zero(errs.yaml);

  // Helper to build a stable result shape:
  const done = (slug?: unknown): t.SlugFromYamlResult => ({
    ok: isOk(),
    path,
    get ast() {
      return ast;
    },
    get slug() {
      return slug;
    },
    errors: wrangle.errors(errs),
  });

  // Structural validation | "Structural" = "does it match the schema shape?"
  const isSchemaValid = Value.Check(SlugSchema, candidate);
  if (isSchemaValid) {
    /**
     * 🌳 Semantic validation
     *    Meaning:      checks logical correctness (rules)
     *    Contrast to:  structural validation checks schema shape only.
     */
    SlugRules.aliasUniqueness(errs.semantic, path, candidate);

    // Optional registry-aware trait id check (no `any`):
    const registry = wrangle.registry(Slug);
    const isKnown = registry?.has.bind(registry); // ← passed method/func.
    SlugRules.traitTypeKnown(errs.semantic, path, candidate, { isKnown });

    // data ↔ alias consistency:
    SlugRules.missingDataForAlias(errs.semantic, path, candidate);
    SlugRules.orphanData(errs.semantic, path, candidate);

    // Enrich semantic errors with AST ranges
    Error.attachSemanticRanges(ast, errs.semantic);

    // Finish up.
    return isOk() ? done(candidate) : done();
  } else {
    // Collect structural schema errors with ranges:
    errs.schema.push(...Schema.Error.fromSchema(ast, Value.Errors(SlugSchema, candidate)));
    return done();
  }
};

/**
 * Helpers:
 */
const wrangle = {
  errors(input: E): t.SlugYamlErrors {
    return {
      get schema() {
        return input.schema;
      },
      get semantic() {
        return input.semantic;
      },
      get yaml() {
        return input.yaml;
      },
    };
  },

  registry(domain: unknown): MaybeRegistry | undefined {
    if (!Is.record(domain)) return undefined;

    const regUnknown = (domain as { Registry?: unknown }).Registry;
    if (!Is.record(regUnknown)) return undefined;

    const has = (regUnknown as { has?: unknown }).has;
    return Is.func(has) ? (regUnknown as MaybeRegistry) : undefined;
  },
} as const;
