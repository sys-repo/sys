import { type t, Is, Obj, Yaml } from './common.ts';
import { resolvePath } from './u.resolve.path.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;

export function makeLenses(yamlPath: t.ObjectPath) {
  const yaml = Obj.Lens.at<string>(yamlPath);
  const alias = Obj.Lens.at<O>(['alias']);
  const sequence = Obj.Lens.at<O[]>(['data', 'sequence']);
  const Lens = {
    get yaml() {
      return yaml;
    },
    get alias() {
      return alias;
    },
    get sequence() {
      return sequence;
    },
  } as const;
  return Lens;
}

export function makeResolvers(yamlPath: t.ObjectPath) {
  const Lens = makeLenses(yamlPath);

  const Resolve = {
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
      return { alias, sequence };
    },
  } as const;

  return { Lens, Resolve };
}
