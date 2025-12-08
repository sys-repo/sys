import { type t, Is, Obj } from '../common.ts';
import { makeParser } from '../u.parser.ts';

type Dag = t.Graph.Dag.Result;
type O = Record<string, unknown>;

export async function extractSequence(dag: Dag, yamlPath: t.ObjectPath, docid: t.Crdt.Id) {
  const Parse = makeParser(yamlPath);
  const root = Parse.parseRoot(dag);
  const node = Parse.findParsedNode(dag, docid);

  if (!node || !node.slug || !node.alias) return;

  // Required: both resolvers
  const indexResolver = root.alias?.resolver;
  const localResolver = node.alias.resolver;
  if (!localResolver) {
    return void console.error('⚠️ Missing local alias resolver on slug node.', docid);
  }
  if (!indexResolver) {
    return void console.error('⚠️ Missing index (root) alias resolver.', docid);
  }

  // Sequence
  const seq = Parse.Lens.sequence.get(node.slug) ?? [];
  asGetters(seq);

  return seq as unknown as t.Sequence;
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
