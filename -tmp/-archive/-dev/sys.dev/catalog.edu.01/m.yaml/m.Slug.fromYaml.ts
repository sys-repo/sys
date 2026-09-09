import { type t, Is, Obj, Schema, SlugSchema, Value, Yaml } from './common.ts';
import { Error } from './m.Slug.Error.ts';
import { evaluateSemanticRules } from './m.Slug.fromYaml.rules.ts';
import { safeApplyNormalizers } from './u.trait.normalize.ts';

type E = t.DeepMutable<t.SlugYamlErrors>;
type O = Record<string, unknown>;

/**
 * Extracts a slug from YAML (string or AST), validates structure (schema) and semantics (rules),
 * and returns the candidate, AST, and categorized diagnostics.
 *
 * Notes:
 *  • No implicit normalizers are derived from the registry;
 *    callers must pass opts.normalizers explicitly if needed.
 *
 *  • Deep validation uses stubs only to enable array-alias traversal;
 *    it does not validate prop shapes unless real schemas are supplied.
 *
 */
export const fromYaml: t.SlugFromYaml = (yamlInput, pathInput, opts = {}) => {
  const ast: t.Yaml.Ast = Is.string(yamlInput) ? Yaml.parseAst(yamlInput) : yamlInput;
  const path: t.ObjectPath = Array.isArray(pathInput)
    ? pathInput
    : Obj.Path.decode(pathInput ?? '');

  // Extract candidate from plain JS value (not AST nodes):
  const root = Yaml.toJS<O>(ast).data;
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

  /**
   * Apply per-trait normalizers BEFORE validation:
   */
  const candidateNormalized = safeApplyNormalizers(candidate, opts.normalizers, errs.semantic);

  /**
   * Structural validation (shape only) on normalized candidate:
   */
  const isSchemaValid = Value.Check(SlugSchema, candidateNormalized);
  if (!isSchemaValid) {
    const errors = Schema.Error.fromSchema(ast, Value.Errors(SlugSchema, candidateNormalized));
    errs.schema.push(...errors);
    return done();
  }
  {
    const semantic = evaluateSemanticRules({
      ast,
      path,
      candidate: candidateNormalized as t.Slug,
      registry: opts.registry,
    });
    errs.semantic.push(...semantic);
  }

  /**
   * Finish up:
   * Attach AST ranges to semantic errors for editor mapping.
   */
  Error.attachSemanticRanges(ast, errs.semantic);
  return isOk() ? done(candidateNormalized) : done();
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
} as const;
