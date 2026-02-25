import { type t, Is, Yaml } from './common.ts';
import { makeLenses } from './u.resolve.lens.ts';
import { resolveAliasPath } from './u.resolve.path.ts';

type O = Record<string, unknown>;
type DagNode = { doc?: { current?: string | undefined } };

export function makeResolvers(yamlPath: t.ObjectPath) {
  const Lens = makeLenses(yamlPath);

  const Resolve = {
    path: resolveAliasPath,
    slug(node: DagNode) {
      const yaml = Lens.yaml.get(node.doc?.current as unknown as Record<string, unknown> | undefined);
      if (!Is.str(yaml)) return undefined;
      const slug = Yaml.parse<O>(yaml).data;
      return Is.record(slug) ? slug : undefined;
    },
    slugParts(node: DagNode) {
      const slug = Resolve.slug(node);
      const alias = slug ? Lens.alias.get(slug) : undefined;
      const traits = slug ? Lens.traits.get(slug) : undefined;
      const data = slug ? Lens.data.get(slug) : undefined;
      return { alias, data, traits };
    },
  };

  return { Lens, Resolve };
}
