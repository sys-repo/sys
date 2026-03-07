import { Is, Schema, type t } from '../common.ts';
import { SlugTraitRegistry, SlugTraitRegistryEntry, SlugTreeItemInline } from './t.ts';
import { SlugTreePropsSchema } from './u.schema.ts';

const SLUG_TREE_REGISTRY = makeRegistry([{ id: 'slug-tree', propsSchema: SlugTreePropsSchema }]);

export const validate: t.SlugTreeSchemaLib['validate'] = (input, opts = {}) => {
  const ok = (doc: t.SlugTreeDoc): t.SlugValidateOK<t.SlugTreeDoc> => ({
    ok: true,
    sequence: doc,
  });
  const fail = (message: string): t.SlugValidateFail => ({
    ok: false,
    error: new Error(message),
  });

  if (!Is.record(input)) {
    return fail('Invalid slug-tree: expected an object with "tree".');
  }

  const tree = (input as { tree?: unknown }).tree;
  if (!Array.isArray(tree)) {
    return fail('Invalid slug-tree: expected "tree" to be an array of items.');
  }

  for (let i = 0; i < tree.length; i += 1) {
    if (!isSlugTreeItemLike(tree[i])) {
      return fail(`Invalid slug-tree item at index ${i}: expected a slug-tree node.`);
    }
  }

  const isValid = Schema.Value.Check(SlugTreePropsSchema, input);
  if (!isValid) {
    return fail('Invalid slug-tree: value does not conform to slug-tree schema.');
  }

  const doc = input as unknown as t.SlugTreeDoc;
  const registry = opts.registry ?? SLUG_TREE_REGISTRY;
  const semanticErrors = validateSemantic({ tree: doc.tree, registry });
  if (semanticErrors.length) {
    return fail(`Invalid slug-tree: ${semanticErrors.join('; ')}`);
  }

  return ok(doc);
};

function validateSemantic(args: { tree: t.SlugTreeItems; registry: SlugTraitRegistry }) {
  const errors: string[] = [];
  const { tree, registry } = args;

  for (const node of tree) {
    traverse(node);
  }

  return errors;

  function traverse(node: t.SlugTreeItem) {
    if (isInline(node)) {
      errors.push(...validateInline(node, registry));
    }
    const children = (node as { slugs?: readonly t.SlugTreeItem[] }).slugs;
    if (Array.isArray(children)) {
      for (const child of children) {
        traverse(child);
      }
    }
  }
}

function validateInline(node: SlugTreeItemInline, registry: SlugTraitRegistry) {
  const traits = Array.isArray(node.traits) ? node.traits : [];
  const { byAlias, aliasToTrait } = indexAliases(traits);
  const data = Is.record(node.data) ? (node.data as Record<string, unknown>) : undefined;

  return [
    ...validateTraitExistence(traits, registry),
    ...validateAliasRules(byAlias, data),
    ...validatePropsShape(data, aliasToTrait, registry),
  ];
}

function validateTraitExistence(traits: readonly t.SlugTrait[], registry: SlugTraitRegistry) {
  const errors: string[] = [];
  for (const trait of traits) {
    const of = trait?.of;
    if (typeof of !== 'string') continue;
    if (!registry.get(of)) {
      errors.push(`Unknown trait id: "${of}"`);
    }
  }
  return errors;
}

function validateAliasRules(
  byAlias: Map<string, number[]>,
  data: Record<string, unknown> | undefined,
) {
  const errors: string[] = [];

  for (const [alias, idxs] of byAlias) {
    if (idxs.length > 1) {
      errors.push(`Duplicate trait alias: "${alias}"`);
    }
  }

  if (!data) {
    for (const alias of byAlias.keys()) {
      errors.push(`Missing data for alias: "${alias}"`);
    }
    return errors;
  }

  for (const alias of byAlias.keys()) {
    if (!(alias in data)) {
      errors.push(`Missing data for alias: "${alias}"`);
    }
  }

  for (const key of Object.keys(data)) {
    if (!byAlias.has(key)) {
      errors.push(`Orphan data: "${key}" (no matching trait alias)`);
    }
  }

  return errors;
}

function validatePropsShape(
  data: Record<string, unknown> | undefined,
  aliasToTrait: Map<string, string>,
  registry: SlugTraitRegistry,
) {
  if (!data) return [];
  const errors: string[] = [];

  for (const [alias, value] of Object.entries(data)) {
    const traitId = aliasToTrait.get(alias);
    if (!traitId) continue;
    const entry = registry.get(traitId);
    if (!entry) continue;
    if (!Schema.Value.Check(entry.propsSchema, value)) {
      errors.push(`Trait data for alias "${alias}" (trait "${traitId}") failed schema validation.`);
    }
  }

  return errors;
}

function indexAliases(traits: readonly t.SlugTrait[]) {
  const byAlias = new Map<string, number[]>();
  const aliasToTrait = new Map<string, string>();

  for (let i = 0; i < traits.length; i++) {
    const alias = traits[i]?.as;
    const of = traits[i]?.of;
    if (typeof alias !== 'string') continue;

    const arr = byAlias.get(alias) ?? [];
    arr.push(i);
    byAlias.set(alias, arr);

    if (typeof of === 'string') {
      aliasToTrait.set(alias, of);
    }
  }

  return { byAlias, aliasToTrait };
}

function isInline(node: t.SlugTreeItem): node is SlugTreeItemInline {
  return (node as { ref?: unknown }).ref === undefined;
}

function isSlugTreeItemLike(value: unknown): value is t.SlugTreeItem {
  return Is.record(value) && typeof (value as { slug?: unknown }).slug === 'string';
}

function makeRegistry(entries: readonly SlugTraitRegistryEntry[]): SlugTraitRegistry {
  const map = new Map<string, SlugTraitRegistryEntry>();
  for (const entry of entries) {
    if (map.has(entry.id)) {
      throw new Error(`SlugTreeRegistry: duplicate id "${entry.id}"`);
    }
    map.set(entry.id, entry);
  }
  return {
    all: entries,
    get(id: string) {
      return map.get(id);
    },
  };
}
