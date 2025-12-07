import { type t, c, Is, Obj } from './common.ts';
import { makeParser } from './u.parser.ts';

type N = t.Graph.Dag.Node;
type O = Record<string, unknown>;

export async function extractSequence(e: t.DocumentGraphDagHookCtx) {
  const Parse = makeParser(e.path.yaml);

  const root = Parse.parseRoot(e.dag);
  const node = Parse.findParsedNode(e.dag, '4VxV2qemEge2SLvANvD9SxZJGJGq');
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
  const seq = Parse.Lens.sequence.get(node.slug) ?? [];
  asGetters(seq);

  console.info(c.cyan('localResolver.alias'), localResolver.alias);
  console.info(c.cyan('indexResolver.alias (root)'), indexResolver.alias);

  console.log('-------------------------------------------');
  for (const item of seq) {
    try {
      const raw = item?.video;
      console.log('video', raw);

      if (!Is.str(raw)) continue;

      const resolved = Parse.Resolve.path(raw, localResolver, indexResolver);

      console.log(c.green('result (path)'), resolved?.value);
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
