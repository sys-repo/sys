import { type t, Is, Yaml } from '../common.ts';
import { makeLenses } from './u.resolve.lens.ts';
import { resolvePath } from './u.resolve.path.ts';

export * from './u.resolve.lens.ts';
export * from './u.resolve.path.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;

/**
 * Factory for DAG-aware slug resolvers + lenses.
 */
export function makeResolvers(yamlPath: t.ObjectPath): t.ResolversLib {
  const Lens = makeLenses(yamlPath);

  const Resolve: t.ResolveLib = {
    path: resolvePath,

    slug(node: N) {
      const yaml = Lens.yaml.get(node.doc?.current);
      if (!Is.str(yaml)) return;
      const slug = Yaml.parse<O>(yaml).data;
      return Is.record(slug) ? slug : undefined;
    },

    slugParts(node: N) {
      const slug = Resolve.slug(node);
      const alias = slug ? Lens.alias.get(slug) : undefined;
      const sequence = slug ? Lens.sequence.get(slug) : undefined;
      const traits = slug ? Lens.traits.get(slug) : undefined;
      return { alias, sequence, traits };
    },
  } as const;

  return {
    Lens,
    Resolve,
  };
}
