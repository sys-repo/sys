import { type t, Is, Obj, SlugSchema } from './common.ts';
import { type DagLike } from './u.dag.ts';
import { makeParser } from './u.parser.ts';
import { normalizeEditorSequenceForTypedYaml } from './u.sequence.normalize.dsl.ts';

export async function sequenceFromDag(
  dag: DagLike,
  yamlPath: t.ObjectPath,
  docid: string,
  opts: { validate?: boolean; trait?: t.SlugTraitGateOptions | null } = {},
): Promise<t.SlugValidateResult<t.SequenceItem[]>> {
  const { validate = false } = opts;
  const ok = (sequence: t.SequenceItem[]) => ({ ok: true, sequence } as const);
  const fail = (message: string) => ({ ok: false, error: new Error(message) } as const);
  if (!Is.record(dag) || !Is.array(dag.nodes)) {
    return fail('Slug graph is invalid (expected "dag.nodes").');
  }
  const dagOk = dag as { nodes: Array<{ id: string; doc?: { current?: string | undefined } }> };
  const parser = makeParser(yamlPath);

  const { ok: pathOk, node } = parser.path(dagOk, docid);
  if (!pathOk || !node) {
    const pathStr = yamlPath.length > 0 ? yamlPath.join('/') : '(root)';
    return fail(`Slug not found for doc "${docid}" at YAML path "${pathStr}".`);
  }

  const { data, traits = [] } = parser.Resolve.slugParts(node.node);
  const defaultTrait: t.SlugTraitGateOptions = { of: 'media-composition' };
  const traitOpt = opts.trait === undefined ? defaultTrait : opts.trait;
  const gate = SlugSchema.Traits.gateAs({ traits, opt: traitOpt });
  if (!gate.ok) return fail(gate.error.message);
  if (!gate.enabled) return fail(`Trait gating disabled for slug "${docid}" (opts.trait === null).`);

  const as = gate.as;
  const lens = Obj.Lens.at<Record<string, unknown>[]>([as]);
  const seqRaw = lens.get(data);
  if (!Array.isArray(seqRaw)) {
    return fail(
      `Slug "${docid}" has no array at "data.${as}" (expected an authoring-time sequence array).`,
    );
  }

  const normalized = normalizeEditorSequenceForTypedYaml(seqRaw);
  if (!normalized) {
    return fail(
      `Unable to normalize authoring-time sequence for slug "${docid}" into the typed YAML shape.`,
    );
  }

  if (!validate) return ok(normalized);
  const result = SlugSchema.MediaComposition.Sequence.validate(normalized);
  if (result.ok) return result;

  const base = result.error.message.replace(/^Invalid sequence:\s*/, '');
  return fail(`Invalid sequence at "data/${as}": ${base}`);
}
