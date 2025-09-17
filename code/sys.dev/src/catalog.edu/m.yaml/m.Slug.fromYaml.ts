import { SlugSchema } from '../m.schema.slug/mod.ts';

import { type t, Is, Obj, Value, Yaml } from './common.ts';
import { SlugRules } from './u.slug.rules.ts';

type R = t.SlugFromYamlResult;
type E = t.DeepMutable<R['errors']>;

export const fromYaml: t.SlugFromYaml = (yamlInput, pathInput) => {
  const ast: t.YamlAst = Is.string(yamlInput) ? Yaml.parseAst(yamlInput) : yamlInput;
  const path: t.ObjectPath = Array.isArray(pathInput)
    ? pathInput
    : Obj.Path.decode(pathInput ?? '');

  // Extract candidate from plain JS value (not AST nodes):
  const root = ast.toJS?.();
  const candidate = Obj.Path.get(root, path);

  // Errors:
  const errs: E = { schema: [], semantic: [], yaml: [] };
  if (Array.isArray(ast.errors) && ast.errors.length > 0) errs.yaml.push(...ast.errors);
  const zero = (arr: ArrayLike<any>) => arr.length === 0;
  const isOk = () => zero(errs.schema) && zero(errs.semantic) && zero(errs.yaml);

  // Helper to build a stable result shape:
  const done = (slug?: unknown): R => {
    return {
      ok: isOk(),
      get ast() {
        return ast;
      },
      get slug() {
        return slug;
      },
      errors: wrangle.errors(errs),
    };
  };

  // Structural validation | "Structural" = "does it match the schema shape?":
  if (Value.Check(SlugSchema, candidate)) {
    const semantic = errs.semantic;

    // Semantic validation. | "Semantic" = "is the object logically valid?" (higher-order rules):
    SlugRules.aliasUniqueness(semantic, path, candidate);

    return isOk() ? done(candidate) : done();
  }

  // Collect structural schema errors (JSON Pointer → ObjectPath):
  const schema = Array.from(Value.Errors(SlugSchema, candidate)).map((e) => ({
    path: Obj.Path.decode(e.path),
    message: e.message,
  }));

  // Finish up.
  errs.schema.push(...schema);
  return done();
};

/**
 * Helpers:
 */
const wrangle = {
  errors(input: E) {
    const { schema, semantic, yaml } = input;
    return {
      get schema() {
        return schema;
      },
      get semantic() {
        return semantic;
      },
      get yaml() {
        return yaml;
      },
    };
  },
} as const;
