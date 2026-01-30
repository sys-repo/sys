import { type t, Is, makeParser, Obj, SlugSchema } from './common.ts';

type R = t.SlugValidateResult<t.SlugTreeDoc>;

export const fromDag: t.SlugTreeLib['fromDag'] = async (dag, yamlPath, docid, opts = {}) => {
  const { validate = false } = opts;
  const parser = makeParser(yamlPath);
  const ok = (doc: t.SlugTreeDoc): R => ({ ok: true, sequence: doc });
  const fail = (message: string): R => ({ ok: false, error: new Error(message) });

  const { ok: pathOk, node } = parser.path(dag, docid);
  if (!pathOk || !node) {
    const pathStr = yamlPath.length > 0 ? yamlPath.join('/') : '(root)';
    return fail(`Slug not found for doc "${docid}" at YAML path "${pathStr}".`);
  }

  const { data, traits = [] } = parser.Resolve.slugParts(node.node);
  const defaultTrait: t.SlugTraitGateOptions = { of: 'slug-tree' };
  const traitOpt = opts.trait === undefined ? defaultTrait : opts.trait;

  const gate = SlugSchema.Traits.gateAs({ traits, opt: traitOpt });
  if (!gate.ok) return fail(gate.error.message);
  if (!gate.enabled) {
    return fail(`Trait gating disabled for slug "${docid}" (opts.trait === null).`);
  }

  const as = gate.as;
  const lens = Obj.Lens.at<unknown>([as]);
  const payload = lens.get(data);

  if (!Is.record(payload)) {
    const err = `Slug "${docid}" has no object at "data.${as}" (expected slug-tree document).`;
    return fail(err);
  }

  const tree = (payload as { tree?: unknown }).tree;
  if (!Array.isArray(tree)) {
    const err = `Slug "${docid}" has no array at "data.${as}.tree" (expected slug-tree array).`;
    return fail(err);
  }

  const doc = payload as t.SlugTreeDoc;
  if (!validate) return ok(doc);

  const result = SlugSchema.Tree.validate(doc, { registry: opts.registry });
  if (result.ok) return result;

  const base = result.error.message.replace(/^Invalid slug-tree:\s*/, '');
  const message = `Invalid slug-tree at "data/${as}": ${base}`;
  return fail(message);
};
