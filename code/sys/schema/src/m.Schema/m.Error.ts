import { type t, Obj, Yaml } from './common.ts';

type NodeOrNil = t.Yaml.Node | null | undefined;

export const Error: t.SchemaErrorLib = {
  fromSchema(ast, errors) {
    return Array.from(errors).map((e): t.SchemaValidationError => {
      const path = Obj.Path.decode(e.path, { numeric: true });
      const node = resolveNode(ast, path);
      return {
        kind: 'schema',
        path,
        message: e.message,
        range: node?.range ?? undefined,
      };
    });
  },

  fromYaml(errors) {
    return errors.map((err): t.SchemaYamlError => {
      type E = { range?: t.Yaml.Range | null };
      return {
        kind: 'yaml',
        yaml: err,
        path: [], // ← NB: parser errors aren’t path-specific.
        message: err.message,
        range: (err as E).range ?? undefined,
      };
    });
  },
};

/**
 * Helpers:
 */
function resolveNode(ast: t.Yaml.Ast, path: t.ObjectPath): NodeOrNil {
  let node = Yaml.Path.atPath(ast, path);
  if (node) return node;

  for (let i = path.length - 1; i >= 0; i--) {
    node = Yaml.Path.atPath(ast, path.slice(0, i));
    if (node) return node;
  }

  return (ast.contents as NodeOrNil) ?? undefined;
}
