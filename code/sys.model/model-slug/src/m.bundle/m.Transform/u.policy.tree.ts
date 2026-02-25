import { type t, Is, Obj, SlugSchema } from './common.ts';
import { type DagLike } from './u.dag.ts';
import { makeParser } from './u.parser.ts';

export async function slugTreeFromDag(
  dag: DagLike,
  yamlPath: t.ObjectPath,
  docid: string,
  opts: { validate?: boolean; trait?: t.SlugTraitGateOptions | null; registry?: unknown } = {},
): Promise<t.SlugValidateResult<t.SlugTreeDoc>> {
  const ok = (doc: t.SlugTreeDoc) => ({ ok: true, sequence: doc } as const);
  const fail = (message: string) => ({ ok: false, error: new Error(message) } as const);
  const { validate = false } = opts;
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
  const defaultTrait: t.SlugTraitGateOptions = { of: 'slug-tree' };
  const traitOpt = opts.trait === undefined ? defaultTrait : opts.trait;
  const gate = SlugSchema.Traits.gateAs({ traits, opt: traitOpt });
  if (!gate.ok) return fail(gate.error.message);
  if (!gate.enabled) return fail(`Trait gating disabled for slug "${docid}" (opts.trait === null).`);

  const as = gate.as;
  const lens = Obj.Lens.at<unknown>([as]);
  const payload = lens.get(data);
  if (!Is.record(payload)) {
    return fail(`Slug "${docid}" has no object at "data.${as}" (expected slug-tree document).`);
  }

  const tree = (payload as { tree?: unknown }).tree;
  if (!Array.isArray(tree)) {
    return fail(`Slug "${docid}" has no array at "data.${as}.tree" (expected slug-tree array).`);
  }

  const doc = payload as t.SlugTreeDoc;
  if (!validate) return ok(doc);
  const result = SlugSchema.Tree.validate(doc);
  if (result.ok) return result;

  const base = result.error.message.replace(/^Invalid slug-tree:\s*/, '');
  return fail(`Invalid slug-tree at "data/${as}": ${base}`);
}
