import { type t, Yaml } from './common.ts';

export const attachSemanticRanges: t.YamlSlugErrorLib['attachSemanticRanges'] = (ast, errs) => {
  for (const err of errs) {
    if (err.range !== undefined) continue;

    // Try exact node
    let node = Yaml.Path.atPath(ast, err.path);

    // Fallback: walk up ancestors until we find a node
    if (!node) {
      for (let i = err.path.length - 1; i >= 0; i--) {
        node = Yaml.Path.atPath(ast, err.path.slice(0, i));
        if (node) break;
      }
      if (!node) node = (ast.contents as t.Yaml.Node | null | undefined) ?? undefined;
    }

    if (node?.range) {
      // Safe: errs is DeepMutable
      (err as any).range = node.range;
    }
  }
};
