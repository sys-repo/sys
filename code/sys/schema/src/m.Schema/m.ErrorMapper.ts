import { type t, Obj, Yaml } from './common.ts';

type NodeOrNil = t.Yaml.Node | null | undefined;

export const ErrorMapper: t.ErrorMapperLib = {
  schema(ast, errors) {
    return Array.from(errors).map((e) => {
      const path = Obj.Path.decode(e.path);
      const node = resolveNode(ast, path);
      return {
        path,
        message: e.message,
        range: node?.range ?? undefined, // ensure no `null`
      };
    });
  },

  yaml(errors) {
    return errors.map((err) => ({
      path: [],
      message: err.message,
      range: (err as any)?.range ?? undefined, // normalize away null
    }));
  },
};

/**
 * Helpers:
 */
function resolveNode(ast: t.Yaml.Ast, path: t.ObjectPath): t.Yaml.Node | undefined {
  let node = Yaml.Path.atPath(ast, path);
  if (node) return node;

  for (let i = path.length - 1; i >= 0; i--) {
    node = Yaml.Path.atPath(ast, path.slice(0, i));
    if (node) return node;
  }

  return (ast.contents as NodeOrNil) ?? undefined;
}
