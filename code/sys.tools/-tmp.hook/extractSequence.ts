import { type t, Is, AliasResolver } from './common.ts';
import { makeResolvers } from './u.resolve.ts';

export async function extractSequence(e: t.DocumentGraphDagHookCtx) {
  const { Lens, Resolve } = makeResolvers(e.path.yaml);
  console.log('Lens', Lens);
  const root = e.dag.nodes[0];
  const rootSlug = Resolve.slug(root);
  const rootAlias = rootSlug ? Lens.alias.get(rootSlug) : undefined;
  const rootIndexAnalysis = Is.record(rootAlias) ? AliasResolver.analyze(rootAlias) : undefined;
  const indexResolver = rootIndexAnalysis?.resolver;

  console.log('indexResolver', indexResolver);
}
