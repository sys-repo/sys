import { type t, Is, Yaml } from './common.ts';
import { makeLenses } from './u.resolve.lens.ts';
import { resolveAliasPath } from './u.path.alias.ts';

type O = Record<string, unknown>;
type ResolveDagNode = t.SlugBundleTransform.Dag.NodeLike & {
  readonly doc?: { readonly current?: string | undefined };
};

export function makeResolvers(yamlPath: t.ObjectPath) {
  const Lens = makeLenses(yamlPath);

  const Resolve = {
    path: resolveAliasPath,
    slug(node: ResolveDagNode) {
      const yaml = Lens.yaml.get(node.doc?.current as unknown as Record<string, unknown> | undefined);
      if (!Is.str(yaml)) return undefined;
      const slug = Yaml.parse<O>(yaml).data;
      return Is.record(slug) ? slug : undefined;
    },
    slugParts(node: ResolveDagNode) {
      const slug = Resolve.slug(node);
      const alias = slug ? Lens.alias.get(slug) : undefined;
      const traits = slug ? Lens.traits.get(slug) : undefined;
      const data = slug ? Lens.data.get(slug) : undefined;
      return { alias, data, traits };
    },
  };

  return { Lens, Resolve };
}
