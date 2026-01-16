import { type t, Is, Yaml } from '../common.ts';
import { makeLenses } from './u.resolve.lens.ts';
import { resolvePath } from './u.resolve.path.ts';

export * from './u.resolve.lens.ts';
export * from './u.resolve.path.ts';

type O = Record<string, unknown>;

/**
 * Factory for DAG-aware slug resolvers + lenses.
 */
export function makeResolvers(yamlPath: t.ObjectPath): t.ResolversLib {
  const Lens = makeLenses(yamlPath);

  const Resolve: t.ResolveLib = {
    path: resolvePath,

    slug(node: t.Graph.Dag.Node) {
      const yaml = Lens.yaml.get(node.doc?.current);
      if (!Is.str(yaml)) return;
      const slug = Yaml.parse<O>(yaml).data;
      return Is.record(slug) ? slug : undefined;
    },

    slugParts(node: t.Graph.Dag.Node) {
      const slug = Resolve.slug(node);
      const alias = slug ? Lens.alias.get(slug) : undefined;
      const traits = slug ? Lens.traits.get(slug) : undefined;
      const data = slug ? Lens.data.get(slug) : undefined;
      return { alias, data, traits };
    },
  };

  return {
    Lens,
    Resolve,
  };
}
