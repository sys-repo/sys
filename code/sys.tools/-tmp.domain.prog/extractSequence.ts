import { type t, Obj, Is } from './common.ts';
import { makeResolvers } from './u.resolve.ts';
import { makeParser } from './u.parseNode.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;

export async function extractSequence(e: t.DocumentGraphDagHookCtx) {
  const { Lens, Resolve } = makeResolvers(e.path.yaml);
  const Parse = makeParser(e);

  const root = Parse.parseRoot(e);
  const node = Parse.findParsedNode(e, '4VxV2qemEge2SLvANvD9SxZJGJGq');
  if (!node || !node.slug || !node.alias) return;

  // REQUIRED: both resolvers
  const indexResolver = root.alias?.resolver;
  const localResolver = node.alias.resolver;

  if (!localResolver) {
    console.error('⚠️ Missing local alias resolver on slug node.');
    return;
  }
  if (!indexResolver) {
    console.error('⚠️ Missing index (root) alias resolver.');
    return;
  }

  // Sequence
  const seq = Lens.sequence.get(node.slug) ?? [];
  asGetters(seq);

  console.log('localResolver.alias', localResolver.alias);
  console.log('indexResolver.alias', indexResolver.alias);

  console.log('-------------------------------------------');

  for (const item of seq) {
    try {
      const raw = item?.video;
      console.log('video', raw);
      console.log('Is.str(video)', Is.str(raw));

      if (!Is.str(raw)) continue;

      const resolved = Resolve.path(raw, localResolver, indexResolver);

      console.log('result', resolved?.value);
      console.log('remaining', resolved?.remaining);
    } catch (err) {
      console.error('Resolve.path error:', err);
    }

    console.log('-------------------------------------------');
  }

  /**
   * Apply getter transforms (unchanged).
   */
  function asGetters(seq: unknown) {
    if (!Array.isArray(seq)) return;
    for (const item of seq) {
      Obj.asGetter(item, ['script']);
      if (Is.record(item.timestamps)) {
        Object.values(item.timestamps)
          .filter((v) => Is.record(v))
          .forEach((v) => Obj.asGetter(v as O));
      }
    }
  }
}
