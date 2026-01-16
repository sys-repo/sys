import { type t, makeParser, Obj, Traits, validateSlugTree } from './common.ts';

type O = Record<string, unknown>;

type R = t.ValidateResult<t.SlugTreeProps>;

export const fromDag: t.SlugTreeLib['fromDag'] = async (dag, yamlPath, docid, opts = {}) => {
  const { validate = false } = opts;
  const parser = makeParser(yamlPath);
  const ok = (tree: t.SlugTreeProps): R => ({ ok: true, sequence: tree });
  const fail = (message: string): R => ({ ok: false, error: new Error(message) });

  const { ok: pathOk, node } = parser.path(dag, docid);
  if (!pathOk || !node) {
    const pathStr = yamlPath.length > 0 ? yamlPath.join('/') : '(root)';
    return fail(`Slug not found for doc "${docid}" at YAML path "${pathStr}".`);
  }

  const { data, traits = [] } = parser.Resolve.slugParts(node.node);
  const defaultTrait: t.SlugTraitGateOptions = { of: 'slug-tree' };
  const traitOpt = opts.trait === undefined ? defaultTrait : opts.trait;

  const gate = Traits.gateAs({ traits, opt: traitOpt });
  if (!gate.ok) return fail(gate.error.message);
  if (!gate.enabled) {
    return fail(`Trait gating disabled for slug "${docid}" (opts.trait === null).`);
  }

  const as = gate.as;
  const lens = Obj.Lens.at<O[]>([as]);
  const payload = lens.get(data);

  if (!Array.isArray(payload)) {
    const err = `Slug "${docid}" has no array at "data.${as}" (expected a slug-tree array).`;
    return fail(err);
  }

  const tree = payload as unknown as t.SlugTreeProps;
  if (!validate) return ok(tree);

  const result = validateSlugTree(tree, { registry: opts.registry });
  if (result.ok) return result;

  const base = result.error.message.replace(/^Invalid slug-tree:\s*/, '');
  const message = `Invalid slug-tree at "data/${as}": ${base}`;
  return fail(message);
};
