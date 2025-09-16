import { SlugSchema } from '../m.schema.slug/mod.ts';
import { type t, Is, Obj, Value, Yaml } from './common.ts';

type R = t.SlugFromYamlResult;
type E = t.DeepMutable<R['errors']>;

export const fromYaml: t.SlugFromYaml = (yamlInput, pathInput) => {
  const ast: t.YamlAst = Is.string(yamlInput) ? Yaml.parseAst(yamlInput) : yamlInput;
  const objectPath: t.ObjectPath = Array.isArray(pathInput)
    ? pathInput
    : Obj.Path.decode(pathInput ?? '');

  // Extract candidate from plain JS value (not AST nodes):
  const root = ast.toJS?.();
  const candidate = Obj.Path.get(root, objectPath);

  // Helper to build a stable result shape:
  const done = (errors: Partial<R['errors']> = {}, slug?: unknown): R => {
    const {
      schema = [] as E['schema'],
      semantic = [] as E['semantic'],
      yaml = (ast.errors ?? []) as E['yaml'],
    } = errors;
    const eqZero = (arr: ArrayLike<any>) => arr.length === 0;
    const ok = eqZero(schema) && eqZero(semantic) && eqZero(yaml);
    return {
      ok,
      get ast() {
        return ast;
      },
      get slug() {
        return slug;
      },
      get errors() {
        return { schema, semantic, yaml };
      },
    };
  };

  if (Value.Check(SlugSchema, candidate)) {
    const semantic: E['semantic'] = [];
    if (candidate && Array.isArray(candidate.traits)) {
      const seen = new Map<string, number[]>();
      (candidate as any).traits.forEach((t: any, i: number) => {
        if (typeof t?.as === 'string') {
          const arr = seen.get(t.as) ?? [];
          arr.push(i);
          seen.set(t.as, arr);
        }
      });
      for (const [alias, idxs] of seen.entries()) {
        if (idxs.length > 1) {
          semantic.push({
            path: [...objectPath, 'traits'],
            message: `Duplicate alias "${alias}"`,
          });
        }
      }
    }

    return semantic.length > 0 ? done({ semantic }) : done({}, candidate);
  }

  const schema = Array.from(Value.Errors(SlugSchema, candidate)).map((e) => ({
    path: Obj.Path.decode(e.path),
    message: e.message,
  }));

  return done({ schema });
};
