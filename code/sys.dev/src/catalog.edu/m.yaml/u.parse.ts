import { SlugSchema } from '../m.schema.slug/mod.ts';
import { type t, Is, Obj, Value, Yaml } from './common.ts';

export const slugFromYaml: t.SlugFromYaml = (input, path) => {
  type R = t.SlugFromYamlResult;
  const done = (errors: R['errors'] = { schema: [], yaml: [] }, slug?: unknown): R => {
    const ok = errors.schema.length === 0;
    return {
      ok,
      get ast() {
        return ast;
      },
      get slug() {
        return slug;
      },
      get errors() {
        return errors;
      },
    };
  };

  // 1. Normalize input → AST:
  const ast = Is.string(input) ? Yaml.parseAst(input) : input;

  // 2. Normalize path → t.ObjectPath:
  const objectPath: t.ObjectPath = Array.isArray(path) ? path : Obj.Path.decode(path ?? '');

  // 3. Extract candidate from the plain JS value (not the AST node):
  const root = ast?.toJS?.();
  const candidate = Obj.Path.get(root, objectPath);

  // 4. Structural validation:
  if (Value.Check(SlugSchema, candidate)) {
    return done({ schema: [], yaml: ast?.errors ?? [] }, candidate);
  }

  // 5. Collect schema errors (convert JSON Pointer → t.ObjectPath)
  const schema = Array.from(Value.Errors(SlugSchema, candidate)).map((e) => ({
    path: Obj.Path.decode(e.path),
    message: e.message,
  }));

  return done({ schema, yaml: ast?.errors ?? [] });
};
