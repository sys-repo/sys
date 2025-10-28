import { type t, Is, Obj, Schema, Slug, SlugSchema, Value, Yaml } from './common.ts';
import { Error } from './m.Slug.Error.ts';
import { SlugRules } from './u.slug.rules.ts';

type E = t.DeepMutable<t.SlugYamlErrors>;
type HasFn = (id: string) => boolean;
type MaybeRegistry = { has: HasFn };

/**
 * Extracts a slug from YAML (string or AST), validates structure (schema) and semantics (rules),
 * and returns the candidate, AST, and categorized diagnostics.
 */
export const fromYaml: t.SlugFromYaml = (yamlInput, pathInput, opts) => {
  const ast: t.Yaml.Ast = Is.string(yamlInput) ? Yaml.parseAst(yamlInput) : yamlInput;
  const path: t.ObjectPath = Array.isArray(pathInput)
    ? pathInput
    : Obj.Path.decode(pathInput ?? '');

  // Extract candidate from plain JS value (not AST nodes):
  const root = ast.toJS?.();
  const candidate = Obj.Path.get(root, path);

  // Collect errors:
  const errs: E = { schema: [], semantic: [], yaml: [] };
  if (Array.isArray(ast.errors) && ast.errors.length > 0) {
    errs.yaml.push(...Schema.Error.fromYaml(ast.errors));
  }

  const zero = (arr: ArrayLike<unknown>) => arr.length === 0;
  const isOk = () => zero(errs.schema) && zero(errs.semantic) && zero(errs.yaml);

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

  // Structural validation (shape only):
  const isSchemaValid = Value.Check(SlugSchema, candidate);
  if (!isSchemaValid) {
    errs.schema.push(...Schema.Error.fromSchema(ast, Value.Errors(SlugSchema, candidate)));
    return done();
  }

  // Semantic validation (logical rules):
  SlugRules.aliasUniqueness(errs.semantic, path, candidate);

  // Registry-aware trait-id existence (delegate → domain fallback):
  const isKnown = wrangle.isKnown(opts, Slug);
  SlugRules.traitTypeKnown(errs.semantic, path, candidate, { isKnown });

  // data ↔ alias consistency:
  SlugRules.missingDataForAlias(errs.semantic, path, candidate);
  SlugRules.orphanData(errs.semantic, path, candidate);

  // Attach AST ranges to semantic errors for editor mapping:
  Error.attachSemanticRanges(ast, errs.semantic);

  return isOk() ? done(candidate) : done();
};

/**
 * Helpers
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
    const reg = (domain as { Registry?: unknown }).Registry;
    if (!Is.record(reg)) return undefined;
    const has = (reg as { has?: unknown }).has;
    return Is.func(has) ? (reg as MaybeRegistry) : undefined;
  },

  /**
   * Resolve the trait-existence checker in priority order:
   * 1) explicit delegate (opts.isKnown),
   * 2) domain Registry.has (if present),
   * 3) <undefined> (rule becomes a no-op).
   */
  isKnown(
    opts: { isKnown?: t.SlugIsKnown } | undefined,
    domain: unknown,
  ): t.SlugIsKnown | undefined {
    if (opts?.isKnown) return opts.isKnown;
    const reg = wrangle.registry(domain);
    return reg?.has.bind(reg);
  },
} as const;
