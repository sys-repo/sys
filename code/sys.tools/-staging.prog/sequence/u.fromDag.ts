import { type t, Is, Obj } from '../common.ts';
import { makeParser } from '../u.parser.ts';
import { normalizeEditorSequenceForTypedYaml } from './u.normalize.ts';
import { validateSequence } from './u.schema.validate.ts';

type Dag = t.Graph.Dag.Result;
type O = Record<string, unknown>;

export const fromDag: t.SequenceLib['fromDag'] = async (
  dag: Dag,
  yamlPath: t.ObjectPath,
  docid: t.Crdt.Id,
  opts = {},
) => {
  const { validate = false } = opts;

  const Parse = makeParser(yamlPath);
  const root = Parse.parseRoot(dag);
  const node = Parse.findParsedNode(dag, docid);

  if (!node || !node.slug || !node.alias) return;

  // Required: both resolvers
  const indexResolver = root.alias?.resolver;
  const localResolver = node.alias.resolver;
  if (!localResolver) {
    console.error('⚠️ Missing local alias resolver on slug node.', docid);
    return;
  }
  if (!indexResolver) {
    console.error('⚠️ Missing index (root) alias resolver.', docid);
    return;
  }

  // Raw YAML sequence from the slug node.
  const seqRaw = Parse.Lens.sequence.get(node.slug) ?? [];

  // Apply getter transforms on the raw objects (unchanged behavior).
  asGetters(seqRaw);

  // Normalize loose editor YAML into the typed-YAML shape.
  const normalized = normalizeEditorSequenceForTypedYaml(seqRaw);
  if (!normalized) return;
  if (!validate) return normalized as t.Sequence;

  // Validate against the schema-backed Sequence.validate.
  const result = validateSequence(normalized);
  if (!result.ok) {
    console.error('⚠️ Invalid sequence for slug node.', docid, result.error);
    return;
  }

  return result.sequence;
};

/**
 * Apply getter transforms (unchanged).
 */
function asGetters(seq: unknown) {
  if (!Array.isArray(seq)) return;
  for (const item of seq) {
    Obj.asGetter(item, ['script']);
    if (Is.record((item as O).timestamps)) {
      Object.values((item as O).timestamps ?? {})
        .filter((v) => Is.record(v))
        .forEach((v) => Obj.asGetter(v as O));
    }
  }
}
