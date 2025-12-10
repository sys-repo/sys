import { type t, Is, Obj, Yaml } from '../common.ts';
import { resolvePath } from './u.resolve.path.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;

export function makeLenses(yamlPath: t.ObjectPath): t.LensLib {
  const yaml = Obj.Lens.at<string>(yamlPath);
  const alias = Obj.Lens.at<O>(['alias']);
  const sequence = Obj.Lens.at<O[]>(['data', 'sequence']);
  const traits = Obj.Lens.at<readonly t.SlugTrait[]>(['traits']);

  const tasks = Obj.Lens.at<t.Task[]>(['TASKS']);
  return Obj.asGetter({
    yaml,
    alias,
    sequence,
    traits,
    tasks,
  });
}

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
